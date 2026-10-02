"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isSpeechAvailable, transcribeAudio } from "@/services/speech/speech.service";

/* Dictado por voz para los composers (tutor IA y chat en vivo).

   Graba con MediaRecorder y manda el audio a pf-back, que lo transcribe con
   Whisper (services/speech). Se eligió eso y no la Web Speech API del
   navegador porque esa no existe en Firefox, falla en Brave y en Chrome
   igual manda el audio a Google: así funciona igual en todos lados.

   Decisiones que vienen de bugs reales:

   - **Nunca bloquear por nivel.** La primera versión descartaba la grabación
     si el volumen no superaba un umbral FIJO (0,015). El micrófono de unos
     auriculares entra bastante más bajo que el de una laptop: la voz se
     grababa igual, pero el hook la tiraba y mostraba "No te escuchamos".
     Ahora el piso de ruido se mide en los primeros ms de cada grabación y el
     umbral es relativo a eso; y ante la duda se manda igual. Sólo se descarta
     el silencio absoluto (micrófono mudo o dispositivo equivocado), que es lo
     único que no tiene nada para transcribir.

   - **Elegir el micrófono.** Sin `deviceId`, getUserMedia toma el
     predeterminado del sistema, que suele no ser el de los auriculares. El
     elegido queda en localStorage.

   - **Texto en vivo.** Cada PARTIAL_INTERVAL_MS se manda lo grabado hasta
     ahí y se muestra como provisional, así se ve lo que se va escribiendo
     mientras se habla. Al cortar, la transcripción final (el audio completo,
     que Whisper lee entero y puntúa mejor) reemplaza a la provisional.

   - El micrófono se apaga al terminar (`track.stop()`), si no queda el punto
     rojo del navegador.

   - El texto NUNCA se envía solo: vuelve por `onTranscript` y el composer lo
     deja en el campo para revisarlo. */

export type VoiceStatus = "idle" | "requesting" | "recording" | "transcribing";

const MAX_SECONDS = 60;

/** Piso absoluto: por debajo de esto no hay señal, el micrófono está mudo. */
const SILENCE_RMS = 0.002;
/** Cuánto tiene que superar al ruido de fondo para contar como voz. */
const VOICE_OVER_NOISE = 2.5;
/** Umbral mínimo, por si la calibración agarra una pieza muy silenciosa. */
const MIN_VOICE_RMS = 0.004;
/** Primeros ms de la grabación: se usan para medir el ruido de fondo. */
const CALIBRATION_MS = 400;

/* Control de ganancia propio. El `autoGainControl` del navegador no siempre
   alcanza: con un micrófono flojo (auriculares, sobre todo Bluetooth) la voz
   llega tan baja que Whisper devuelve cualquier cosa — "On... On...", "El
   El" — en vez de lo que se dijo. Medido con un audio atenuado a propósito.
   Por eso el audio pasa por un GainNode antes de grabarse, con la ganancia
   ajustada sola para que los picos queden cerca de AGC_TARGET_PEAK. */
const AGC_TARGET_PEAK = 0.25;
const AGC_MAX_GAIN = 20;
/** Cada cuánto se recalcula la ganancia (ms). */
const AGC_UPDATE_MS = 200;
/** El pico de referencia se olvida de a poco, para seguir los cambios de voz. */
const AGC_PEAK_DECAY = 0.85;

/** Cada cuánto se manda lo grabado para mostrar el texto provisional. Son
    ~3 s de espera antes de ver la primera palabra; bajarlo más no acelera
    mucho (la llamada ya tarda ~1 s) y multiplica el gasto. */
const PARTIAL_INTERVAL_MS = 3000;
/** Antes de esto no hay casi nada que transcribir. */
const MIN_PARTIAL_MS = 1500;

const DEVICE_STORAGE_KEY = "campus.microphone";

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

function readStoredDevice(): string | null {
  try {
    return localStorage.getItem(DEVICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function microphoneErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "No tenemos permiso para usar el micrófono. Habilitalo desde el candado de la barra de direcciones y probá de nuevo.";
    case "NotFoundError":
      return "No encontramos ningún micrófono conectado.";
    case "OverconstrainedError":
      return "El micrófono que elegiste ya no está disponible. Elegí otro desde el menú del micrófono.";
    case "NotReadableError":
    case "AbortError":
      return "El micrófono está siendo usado por otra aplicación. Cerrala y probá de nuevo.";
    default:
      return "No pudimos acceder al micrófono.";
  }
}

type AudioContextCtor = typeof AudioContext;

export interface MicrophoneOption {
  deviceId: string;
  label: string;
}

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
  /** Texto que se va reconociendo mientras se habla (provisional). */
  partialText: string;
  error: string | null;
  /** Micrófonos disponibles (vacío hasta que haya permiso). */
  devices: MicrophoneOption[];
  selectedDeviceId: string | null;
  selectDevice: (deviceId: string) => void;
  /** Nombre del micrófono que se está usando de verdad. */
  activeDeviceLabel: string | null;
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
  const [partialText, setPartialText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MicrophoneOption[]>([]);
  /* Lazy y no en un efecto: en el primer render `devices` está vacío, así que
     nada de lo que se pinta depende de esto y no hay mismatch de hidratación. */
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readStoredDevice(),
  );
  const [activeDeviceLabel, setActiveDeviceLabel] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const partialTimerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  /** Medidas de la grabación en curso: pico, piso de ruido, ms con voz y la
      ganancia que hizo falta (si es muy alta, el micrófono entra flojo). */
  const audioStatsRef = useRef({ peak: 0, noiseFloor: 0, voicedMs: 0, appliedGain: 1 });
  /** Una sola parcial en vuelo; las respuestas viejas se descartan. */
  const partialInFlightRef = useRef(false);
  const partialSeqRef = useRef(0);

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

  /** La lista de micrófonos sólo trae nombres después del primer permiso. */
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      if (!mountedRef.current) return;
      setDevices(
        all
          .filter((device) => device.kind === "audioinput" && device.deviceId)
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Micrófono ${index + 1}`,
          })),
      );
    } catch {
      // Sin lista se usa el predeterminado: no es un error que mostrar.
    }
  }, []);

  /* Si el permiso ya está dado de antes, la lista se arma al montar: así el
     selector de micrófono está disponible desde el primer dictado y no
     recién después de grabar una vez. Sin permiso, `enumerateDevices`
     devuelve entradas sin nombre y no sirve para elegir. */
  useEffect(() => {
    if (!browserSupportsRecording() || !navigator.permissions?.query) return;
    let active = true;
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((permission) => {
        if (active && permission.state === "granted") void refreshDevices();
      })
      .catch(() => {
        // Firefox no soporta consultar el permiso de micrófono: la lista se
        // arma igual al grabar por primera vez.
      });
    return () => {
      active = false;
    };
  }, [refreshDevices]);

  // Si se enchufan o desenchufan auriculares, la lista se actualiza sola.
  useEffect(() => {
    const media = navigator.mediaDevices;
    if (!media?.addEventListener) return;
    const onChange = () => void refreshDevices();
    media.addEventListener("devicechange", onChange);
    return () => media.removeEventListener("devicechange", onChange);
  }, [refreshDevices]);

  const selectDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    } catch {
      // Modo privado: se usa igual en esta sesión.
    }
  }, []);

  /** Suelta todo lo que retiene el micrófono (y el punto rojo del navegador). */
  const releaseResources = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (partialTimerRef.current !== null) window.clearInterval(partialTimerRef.current);
    frameRef.current = null;
    timerRef.current = null;
    partialTimerRef.current = null;
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
      partialSeqRef.current += 1; // invalida cualquier parcial en vuelo
      if (!mountedRef.current) return;
      setLevel(0);

      if (cancelledRef.current) {
        setStatus("idle");
        setPartialText("");
        return;
      }

      const { peak, voicedMs, appliedGain } = audioStatsRef.current;
      /* Hubo que amplificar casi al máximo: el micrófono entra tan bajo que
         Whisper puede no entender. Sólo se usa para explicar un dictado que
         falló, nunca para alertar sobre uno que salió bien. */
      const micTooQuiet = appliedGain >= AGC_MAX_GAIN * 0.95;
      /* Sólo se descarta el silencio real: micrófono mudo, silenciado o un
         dispositivo que no es el que la persona está usando. Si entró algo
         de señal se manda igual, aunque el detector de voz no haya dado:
         gastar una transcripción es mucho menos grave que comerse lo que
         alguien dictó. */
      if (durationMs < 400 || peak < SILENCE_RMS) {
        setStatus("idle");
        setPartialText("");
        setError(
          peak < SILENCE_RMS && durationMs >= 400
            ? "No entró nada de audio. Fijate que el micrófono no esté silenciado, o elegí otro con el botón de al lado."
            : "La grabación fue muy corta. Mantené el micrófono abierto mientras hablás.",
        );
        return;
      }

      setStatus("transcribing");
      try {
        const text = await transcribeAudio(new Blob(chunks, { type: mimeType }), contextRef.current);
        if (!mountedRef.current) return;
        if (text) {
          /* Salió texto: no se avisa nada, ni aunque haya hecho falta mucha
             ganancia. Un cartel rojo sobre un dictado que salió bien sólo
             asusta, y quien lee el resultado ya juzga si está bien. */
          onTranscriptRef.current(text);
        } else {
          // Hubo señal pero Whisper no entendió nada.
          setError(
            micTooQuiet || voicedMs === 0
              ? "Casi no se escuchó tu voz. Acercate al micrófono, subí su volumen en Windows, o elegí otro con el botón de al lado."
              : "No pudimos entender el audio. Probá de nuevo, hablando un poco más fuerte o más cerca.",
          );
        }
      } catch (caught) {
        if (mountedRef.current) {
          setError(caught instanceof Error ? caught.message : "No pudimos pasar tu audio a texto.");
        }
      } finally {
        if (mountedRef.current) {
          setStatus("idle");
          setPartialText("");
        }
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
    partialSeqRef.current += 1;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else {
      releaseResources();
      setStatus("idle");
      setPartialText("");
    }
  }, [releaseResources]);

  /**
   * Manda lo grabado hasta ahora para ir mostrando el texto. El blob se arma
   * con TODOS los chunks desde el principio porque en webm sólo el primero
   * trae los headers: un chunk suelto no se puede decodificar.
   */
  const sendPartial = useCallback(async (mimeType: string) => {
    if (partialInFlightRef.current || cancelledRef.current) return;
    if (Date.now() - startedAtRef.current < MIN_PARTIAL_MS) return;
    if (audioStatsRef.current.peak < SILENCE_RMS) return;
    const chunks = chunksRef.current;
    if (!chunks.length) return;

    const seq = partialSeqRef.current;
    partialInFlightRef.current = true;
    try {
      const text = await transcribeAudio(new Blob(chunks, { type: mimeType }), contextRef.current);
      // Llegó tarde (ya se cortó o se canceló): no pisar nada.
      if (mountedRef.current && seq === partialSeqRef.current && text) setPartialText(text);
    } catch {
      // Las parciales son un lujo: si fallan, el texto final igual va a salir.
    } finally {
      partialInFlightRef.current = false;
    }
  }, []);

  const start = useCallback(async () => {
    if (status !== "idle") return;
    setError(null);
    setElapsedSeconds(0);
    setPartialText("");
    cancelledRef.current = false;
    audioStatsRef.current = { peak: 0, noiseFloor: 0, voicedMs: 0, appliedGain: 1 };
    partialInFlightRef.current = false;
    partialSeqRef.current += 1;
    chunksRef.current = [];
    setStatus("requesting");

    const wanted = selectedDeviceId;
    async function openMicrophone(): Promise<MediaStream> {
      const audio: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      if (wanted) audio.deviceId = { exact: wanted };
      try {
        return await navigator.mediaDevices.getUserMedia({ audio });
      } catch (caught) {
        // El guardado ya no existe (auriculares desenchufados): el
        // predeterminado es mejor que no poder grabar.
        if (wanted && caught instanceof DOMException && caught.name === "OverconstrainedError") {
          return navigator.mediaDevices.getUserMedia({ audio: { ...audio, deviceId: undefined } });
        }
        throw caught;
      }
    }

    let stream: MediaStream;
    try {
      stream = await openMicrophone();
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
    const track = stream.getAudioTracks()[0];
    setActiveDeviceLabel(track?.label || null);
    // Recién con el permiso dado la lista trae los nombres de verdad.
    void refreshDevices();

    /* Cadena de audio:

         micrófono ──┬─> preAnalyser        (nivel REAL, para decidir si hubo voz)
                     └─> gain ─> limiter ─> destino ─> MediaRecorder

       El GainNode es el que salva al micrófono flojo; el compresor evita que
       al amplificar sature. Si el navegador no tiene Web Audio se graba el
       stream crudo: peor calidad, pero funciona. */
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;

    let recordedStream = stream;
    let analyserForMeter: AnalyserNode | null = null;
    let analyserForVoice: AnalyserNode | null = null;
    let gainNode: GainNode | null = null;

    if (Ctor) {
      const audioContext = new Ctor();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);

      analyserForVoice = audioContext.createAnalyser();
      analyserForVoice.fftSize = 1024;
      source.connect(analyserForVoice);

      gainNode = audioContext.createGain();
      gainNode.gain.value = 1;
      source.connect(gainNode);

      // Limitador suave: amplificar sin que los picos recorten.
      const limiter = audioContext.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.12;
      gainNode.connect(limiter);

      analyserForMeter = audioContext.createAnalyser();
      analyserForMeter.fftSize = 1024;
      limiter.connect(analyserForMeter);

      const destination = audioContext.createMediaStreamDestination();
      limiter.connect(destination);
      recordedStream = destination.stream;
    }

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      // 32 kbps alcanza y sobra para voz: un minuto pesa ~240 KB.
      recorder = new MediaRecorder(recordedStream, {
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
    const effectiveMime = recorder.mimeType || mimeType || "audio/webm";
    recorder.onstop = () => void handleRecordingStopped(effectiveMime);

    /* Un solo bucle hace tres cosas, todas sobre el nivel del micrófono:

       1. Mide el ruido de fondo (primeros CALIBRATION_MS) y, pasado eso,
          cuenta cuánto tiempo hubo voz de verdad. El umbral es RELATIVO al
          ruido, así un micrófono flojo no queda afuera por un número mágico.
       2. Ajusta la ganancia para que los picos lleguen a AGC_TARGET_PEAK:
          sin esto, Whisper devuelve cualquier cosa con un micrófono bajo.
       3. Pinta el medidor (ya con la ganancia aplicada, así se ve que lo
          estamos escuchando). */
    if (analyserForVoice && gainNode && audioContextRef.current) {
      const audioContext = audioContextRef.current;
      const gain = gainNode;
      const rawSamples = new Float32Array(analyserForVoice.fftSize);
      const meterSamples = analyserForMeter ? new Float32Array(analyserForMeter.fftSize) : null;
      const voiceAnalyser = analyserForVoice;
      const meterAnalyser = analyserForMeter;
      let lastFrame = performance.now();
      let lastPaint = 0;
      let lastGainUpdate = 0;
      let calibrationSum = 0;
      let calibrationCount = 0;
      let recentPeak = 0;

      const rmsOf = (buffer: Float32Array) => {
        let sum = 0;
        for (const sample of buffer) sum += sample * sample;
        return Math.sqrt(sum / buffer.length);
      };

      const tick = (now: number) => {
        voiceAnalyser.getFloatTimeDomainData(rawSamples);
        const rms = rmsOf(rawSamples);
        const stats = audioStatsRef.current;
        stats.peak = Math.max(stats.peak, rms);

        const elapsed = now - startedAtRef.current;
        if (elapsed < CALIBRATION_MS) {
          calibrationSum += rms;
          calibrationCount += 1;
          stats.noiseFloor = calibrationCount ? calibrationSum / calibrationCount : 0;
        } else {
          const threshold = Math.max(stats.noiseFloor * VOICE_OVER_NOISE, MIN_VOICE_RMS);
          if (rms > threshold) stats.voicedMs += now - lastFrame;
        }
        lastFrame = now;

        // Ganancia: se persigue el pico reciente, que decae de a poco para
        // no quedar pegado a un portazo o a una tos.
        recentPeak = Math.max(rms, recentPeak * AGC_PEAK_DECAY);
        if (now - lastGainUpdate > AGC_UPDATE_MS) {
          lastGainUpdate = now;
          if (recentPeak > SILENCE_RMS) {
            const wanted = Math.min(AGC_MAX_GAIN, Math.max(1, AGC_TARGET_PEAK / recentPeak));
            stats.appliedGain = wanted;
            // setTargetAtTime: el cambio entra suave, sin saltos audibles.
            gain.gain.setTargetAtTime(wanted, audioContext.currentTime, 0.15);
          }
        }

        if (now - lastPaint > 80) {
          lastPaint = now;
          if (meterAnalyser && meterSamples) {
            meterAnalyser.getFloatTimeDomainData(meterSamples);
            setLevel(Math.min(1, rmsOf(meterSamples) / AGC_TARGET_PEAK));
          } else {
            setLevel(Math.min(1, rms / Math.max(stats.peak, MIN_VOICE_RMS * 4)));
          }
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }

    startedAtRef.current = performance.now();
    // timeslice: pedacitos periódicos para poder transcribir mientras habla.
    recorder.start(1000);
    startedAtRef.current = Date.now();
    setStatus("recording");
    timerRef.current = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(seconds);
      if (seconds >= MAX_SECONDS && recorder.state === "recording") recorder.stop();
    }, 250);
    partialTimerRef.current = window.setInterval(() => {
      if (recorder.state === "recording") void sendPartial(effectiveMime);
    }, PARTIAL_INTERVAL_MS);
  }, [status, selectedDeviceId, releaseResources, handleRecordingStopped, refreshDevices, sendPartial]);

  return {
    isAvailable,
    status,
    isActive: status !== "idle",
    elapsedSeconds,
    maxSeconds: MAX_SECONDS,
    level,
    partialText,
    error,
    devices,
    selectedDeviceId,
    selectDevice,
    activeDeviceLabel,
    start: () => void start(),
    stop,
    cancel,
    clearError: useCallback(() => setError(null), []),
  };
}
