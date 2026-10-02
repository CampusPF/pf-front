"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isSpeechAvailable, transcribeAudio } from "@/services/speech/speech.service";

/* Dictado por voz para los composers (tutor IA y chat en vivo).

   Graba con MediaRecorder y manda el audio a pf-back, que lo transcribe con
   Whisper (services/speech). Se eligió eso y no la Web Speech API del
   navegador porque esa no existe en Firefox, falla en Brave y en Chrome
   igual manda el audio a Google: así funciona igual en todos lados.

   Detalles que importan:
   - Silencio: Whisper no devuelve vacío con silencio, INVENTA una frase
     ("Gracias.", "Subtítulos por Amara.org"). Por eso se mide el nivel del
     micrófono mientras se graba y, si nunca hubo voz, no se manda nada.
   - Al terminar se apagan los tracks del micrófono: si no, el navegador
     sigue mostrando el punto rojo de "grabando".
   - El texto NUNCA se envía solo: vuelve por `onTranscript` y el composer
     lo deja en el campo para revisarlo. */

export type VoiceStatus = "idle" | "requesting" | "recording" | "transcribing";

const MAX_SECONDS = 60;
/** RMS (0–1) a partir del cual consideramos que hay voz. El ruido de una
    pieza callada con noiseSuppression queda bien por debajo. */
const VOICE_RMS_THRESHOLD = 0.015;
/** Tiempo mínimo con voz para que valga la pena transcribir. */
const MIN_VOICED_MS = 300;

/** Formatos en orden de preferencia: Opus pesa poco y es lo que graba
    Chrome/Firefox; Safari (y iOS) sólo graba mp4/AAC. */
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

function browserSupportsRecording(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

function microphoneErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "No tenemos permiso para usar el micrófono. Habilitalo desde el candado de la barra de direcciones y probá de nuevo.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No encontramos ningún micrófono conectado.";
    case "NotReadableError":
    case "AbortError":
      return "El micrófono está siendo usado por otra aplicación. Cerrala y probá de nuevo.";
    default:
      return "No pudimos acceder al micrófono.";
  }
}

type AudioContextCtor = typeof AudioContext;

export interface VoiceRecorder {
  /** El navegador puede grabar Y el back tiene el dictado configurado. */
  isAvailable: boolean;
  status: VoiceStatus;
  /** Grabando, pidiendo permiso o transcribiendo: el composer cambia de modo. */
  isActive: boolean;
  elapsedSeconds: number;
  maxSeconds: number;
  /** Nivel del micrófono, 0–1, para el medidor visual. */
  level: number;
  error: string | null;
  start: () => void;
  /** Termina la grabación y la transcribe. */
  stop: () => void;
  /** Descarta la grabación sin transcribir. */
  cancel: () => void;
  clearError: () => void;
}

export function useVoiceRecorder({
  onTranscript,
  context,
}: {
  onTranscript: (text: string) => void;
  /** Título de la lección o del curso: le da vocabulario a Whisper. */
  context?: string | null;
}): VoiceRecorder {
  const [isAvailable, setIsAvailable] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const voicedMsRef = useRef(0);
  const startedAtRef = useRef(0);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  // Los callbacks del recorder viven más que un render: leen lo último.
  const onTranscriptRef = useRef(onTranscript);
  const contextRef = useRef(context);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    contextRef.current = context;
  }, [onTranscript, context]);

  useEffect(() => {
    mountedRef.current = true;
    if (!browserSupportsRecording()) return;
    let active = true;
    void isSpeechAvailable().then((available) => {
      if (active) setIsAvailable(available);
    });
    return () => {
      active = false;
    };
  }, []);

  /** Suelta todo lo que retiene el micrófono (y el punto rojo del navegador). */
  const releaseResources = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    frameRef.current = null;
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
  }, []);

  useEffect(
    () => () => {
      mountedRef.current = false;
      cancelledRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      releaseResources();
    },
    [releaseResources],
  );

  const handleRecordingStopped = useCallback(
    async (mimeType: string) => {
      releaseResources();
      const durationMs = Date.now() - startedAtRef.current;
      const chunks = chunksRef.current;
      chunksRef.current = [];
      if (!mountedRef.current) return;
      setLevel(0);

      if (cancelledRef.current) {
        setStatus("idle");
        return;
      }
      if (durationMs < 500 || voicedMsRef.current < MIN_VOICED_MS) {
        setStatus("idle");
        setError("No te escuchamos. Acercate al micrófono o hablá un poco más fuerte.");
        return;
      }

      setStatus("transcribing");
      try {
        const text = await transcribeAudio(new Blob(chunks, { type: mimeType }), contextRef.current);
        if (!mountedRef.current) return;
        if (text) onTranscriptRef.current(text);
        else setError("No pudimos entender el audio. Probá de nuevo, hablando un poco más claro.");
      } catch (caught) {
        if (mountedRef.current) {
          setError(caught instanceof Error ? caught.message : "No pudimos pasar tu audio a texto.");
        }
      } finally {
        if (mountedRef.current) setStatus("idle");
      }
    },
    [releaseResources],
  );

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else {
      releaseResources();
      setStatus("idle");
    }
  }, [releaseResources]);

  const start = useCallback(async () => {
    if (status !== "idle") return;
    setError(null);
    setElapsedSeconds(0);
    cancelledRef.current = false;
    voicedMsRef.current = 0;
    chunksRef.current = [];
    setStatus("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (caught) {
      if (mountedRef.current) {
        setStatus("idle");
        setError(microphoneErrorMessage(caught));
      }
      return;
    }
    // Se canceló (o se desmontó) mientras el navegador pedía permiso.
    if (!mountedRef.current || cancelledRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      if (mountedRef.current) setStatus("idle");
      return;
    }
    streamRef.current = stream;

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      // 32 kbps alcanza y sobra para voz: un minuto pesa ~240 KB.
      recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32_000,
      });
    } catch {
      releaseResources();
      setStatus("idle");
      setError("Tu navegador no puede grabar audio. Probá con Chrome, Edge, Firefox o Safari actualizados.");
      return;
    }
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => void handleRecordingStopped(recorder.mimeType || mimeType || "audio/webm");

    // Medidor de nivel: RMS del audio en cada frame. Sirve para el feedback
    // visual y para saber si de verdad se habló (ver MIN_VOICED_MS).
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (Ctor) {
      const audioContext = new Ctor();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let lastFrame = performance.now();
      let lastPaint = 0;
      const tick = (now: number) => {
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        const rms = Math.sqrt(sum / samples.length);
        if (rms > VOICE_RMS_THRESHOLD) voicedMsRef.current += now - lastFrame;
        lastFrame = now;
        // Repintar el medidor ~12 veces por segundo alcanza.
        if (now - lastPaint > 80) {
          lastPaint = now;
          setLevel(Math.min(1, rms * 8));
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } else {
      // Sin Web Audio no podemos medir: que no se descarte lo grabado.
      voicedMsRef.current = MIN_VOICED_MS;
    }

    startedAtRef.current = Date.now();
    recorder.start();
    setStatus("recording");
    timerRef.current = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(seconds);
      if (seconds >= MAX_SECONDS && recorder.state === "recording") recorder.stop();
    }, 250);
  }, [status, releaseResources, handleRecordingStopped]);

  return {
    isAvailable,
    status,
    isActive: status !== "idle",
    elapsedSeconds,
    maxSeconds: MAX_SECONDS,
    level,
    error,
    start: () => void start(),
    stop,
    cancel,
    clearError: useCallback(() => setError(null), []),
  };
}
