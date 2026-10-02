"use client";

import { useEffect, useRef } from "react";
import { Check, Loader2, Mic, X } from "lucide-react";

import type { VoiceRecorder } from "@/hooks/useVoiceRecorder";

/* Piezas del dictado por voz que comparten los dos composers (tutor IA y
   chat en vivo). El estado vive en useVoiceRecorder; esto sólo lo pinta.

   Patrón: el micrófono va al lado de "Enviar". Mientras se graba, la barra
   de grabación ocupa el lugar del textarea (como en las apps de mensajería),
   con el tiempo, un medidor de nivel que muestra que el micrófono escucha,
   "Cancelar" y "Listo". Al terminar, el texto queda en el campo para
   revisarlo: nunca se envía solo. */

const ICON_BUTTON =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function MicButton({ voice, disabled = false }: { voice: VoiceRecorder; disabled?: boolean }) {
  if (!voice.isAvailable) return null;
  return (
    <button
      type="button"
      onClick={voice.start}
      disabled={disabled || voice.isActive}
      aria-label="Dictar por voz"
      title="Dictar por voz"
      className={`${ICON_BUTTON} border-border text-text-secondary hover:bg-surface-elevated hover:text-text border`}
    >
      <Mic className="size-5" aria-hidden />
    </button>
  );
}

/** Ocupa el lugar del textarea mientras se pide permiso, se graba o se transcribe. */
export function RecordingBar({ voice }: { voice: VoiceRecorder }) {
  const stopRef = useRef<HTMLButtonElement>(null);
  const isRecording = voice.status === "recording";

  // Al empezar a grabar, el foco va a "Listo": Enter/Espacio terminan.
  useEffect(() => {
    if (isRecording) stopRef.current?.focus();
  }, [isRecording]);

  const remaining = voice.maxSeconds - voice.elapsedSeconds;
  const label =
    voice.status === "requesting"
      ? "Esperando permiso del micrófono…"
      : voice.status === "transcribing"
        ? "Pasando tu audio a texto…"
        : "Grabando";

  return (
    <div
      className="bg-surface-elevated border-border flex min-h-10 flex-1 items-center gap-2 rounded-lg border px-2 py-1"
      onKeyDown={(event) => {
        if (event.key === "Escape" && voice.status !== "transcribing") {
          event.preventDefault();
          voice.cancel();
        }
      }}
    >
      {voice.status !== "transcribing" && (
        <button
          type="button"
          onClick={voice.cancel}
          aria-label="Cancelar grabación"
          title="Cancelar (Esc)"
          className={`${ICON_BUTTON} text-text-muted hover:text-text size-8`}
        >
          <X className="size-4" aria-hidden />
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
        {voice.status === "transcribing" || voice.status === "requesting" ? (
          <Loader2 className="text-primary size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <span className="bg-danger size-2.5 shrink-0 animate-pulse rounded-full" aria-hidden />
        )}
        <span className="text-text truncate text-sm">{label}</span>
        {isRecording && (
          <>
            <span className="text-text-muted text-xs tabular-nums">
              {formatSeconds(voice.elapsedSeconds)}
            </span>
            <LevelMeter level={voice.level} />
            {remaining <= 10 && (
              <span className="text-warning hidden text-xs sm:inline">quedan {remaining} s</span>
            )}
          </>
        )}
      </div>

      {isRecording && (
        <button
          ref={stopRef}
          type="button"
          onClick={voice.stop}
          aria-label="Terminar y pasar a texto"
          title="Listo"
          className={`${ICON_BUTTON} bg-primary-solid hover:bg-primary-solid-hover size-8 text-white`}
        >
          <Check className="size-4" aria-hidden />
        </button>
      )}

      {/* Lectores de pantalla: se anuncia el cambio de estado, no cada segundo. */}
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </div>
  );
}

/** Cinco barras que siguen el volumen: muestra que el micrófono escucha. */
function LevelMeter({ level }: { level: number }) {
  const bars = [0.35, 0.7, 1, 0.7, 0.35];
  return (
    <span className="flex h-4 items-center gap-0.5" aria-hidden>
      {bars.map((weight, index) => (
        <span
          key={index}
          className="bg-primary w-0.5 rounded-full transition-[height] duration-75"
          style={{ height: `${Math.max(3, Math.round(16 * Math.min(1, level * weight * 1.6)))}px` }}
        />
      ))}
    </span>
  );
}

/** Error del dictado (permiso denegado, no se escuchó, etc.), arriba del composer. */
export function VoiceError({ voice }: { voice: VoiceRecorder }) {
  if (!voice.error) return null;
  return (
    <p role="alert" className="text-danger flex items-start gap-2 px-3 pt-2 text-xs">
      <span className="flex-1">{voice.error}</span>
      <button
        type="button"
        onClick={voice.clearError}
        aria-label="Cerrar aviso"
        className="text-text-muted hover:text-text shrink-0 cursor-pointer"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </p>
  );
}

/** Suma lo dictado a lo que ya estaba escrito, con un espacio de por medio. */
export function appendDictation(current: string, dictated: string): string {
  const base = current.trimEnd();
  return base ? `${base} ${dictated}` : dictated;
}
