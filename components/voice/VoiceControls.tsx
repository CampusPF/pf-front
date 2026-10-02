"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Mic, X } from "lucide-react";

import type { VoiceRecorder } from "@/hooks/useVoiceRecorder";

/* Piezas del dictado por voz que comparten los dos composers (tutor IA y
   chat en vivo). El estado vive en useVoiceRecorder; esto sólo lo pinta.

   Patrón: el micrófono va al lado de "Enviar". Mientras se graba, la barra
   de grabación ocupa el lugar del textarea (como en las apps de mensajería)
   y muestra EL TEXTO QUE SE VA RECONOCIENDO, para no escribir a ciegas; más
   el tiempo, un medidor de nivel que prueba que el micrófono escucha,
   "Cancelar" y "Listo". Al terminar, el texto final queda en el campo para
   revisarlo: nunca se envía solo. */

const ICON_BUTTON =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function MicButton({ voice, disabled = false }: { voice: VoiceRecorder; disabled?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (!voice.isAvailable) return null;

  // El selector recién tiene sentido cuando el navegador nos dio la lista
  // (después del primer permiso) y hay más de un micrófono.
  const canChooseDevice = voice.devices.length > 1;

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        onClick={voice.start}
        disabled={disabled || voice.isActive}
        aria-label="Dictar por voz"
        title="Dictar por voz"
        className={`${ICON_BUTTON} border-border text-text-secondary hover:bg-surface-elevated hover:text-text border ${
          canChooseDevice ? "rounded-r-none border-r-0" : ""
        }`}
      >
        <Mic className="size-5" aria-hidden />
      </button>

      {canChooseDevice && (
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          disabled={disabled || voice.isActive}
          aria-label="Elegir micrófono"
          title="Elegir micrófono"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={`${ICON_BUTTON} border-border text-text-muted hover:bg-surface-elevated hover:text-text w-5 rounded-l-none border`}
        >
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      )}

      {menuOpen && (
        <div
          role="menu"
          aria-label="Micrófonos disponibles"
          // max-w-[calc(100vw-2rem)]: en mobile el menú no se sale de la pantalla.
          className="bg-surface-elevated border-border absolute right-0 bottom-full z-50 mb-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border p-1 shadow-2xl"
        >
          <p className="text-text-muted px-3 py-1.5 text-xs font-medium">Micrófono</p>
          {voice.devices.map((device) => {
            const isSelected = device.deviceId === voice.selectedDeviceId;
            return (
              <button
                key={device.deviceId}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  voice.selectDevice(device.deviceId);
                  setMenuOpen(false);
                }}
                className="hover:bg-surface flex w-full cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150"
              >
                <Check
                  className={`mt-0.5 size-4 shrink-0 ${isSelected ? "text-primary" : "opacity-0"}`}
                  aria-hidden
                />
                {/* Dos líneas en vez de truncar: "Auriculares (HyperX…)" y
                    "Auriculares (Logitech…)" se distinguen por el final. */}
                <span className="text-text line-clamp-2 leading-snug">{device.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Ocupa el lugar del textarea mientras se pide permiso, se graba o se transcribe. */
export function RecordingBar({ voice }: { voice: VoiceRecorder }) {
  const stopRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const isRecording = voice.status === "recording";

  // Al empezar a grabar, el foco va a "Listo": Enter/Espacio terminan.
  useEffect(() => {
    if (isRecording) stopRef.current?.focus();
  }, [isRecording]);

  // Lo último dictado siempre a la vista, como en un subtitulado.
  useEffect(() => {
    const element = textRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [voice.partialText]);

  const remaining = voice.maxSeconds - voice.elapsedSeconds;
  const statusLabel =
    voice.status === "requesting"
      ? "Esperando permiso del micrófono…"
      : voice.status === "transcribing"
        ? "Terminando de pasar tu audio a texto…"
        : voice.partialText
          ? "Grabando"
          : "Te escuchamos… empezá a hablar";

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

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-1 py-0.5">
        <div className="flex items-center gap-2">
          {voice.status === "transcribing" || voice.status === "requesting" ? (
            <Loader2 className="text-primary size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <span className="bg-danger size-2 shrink-0 animate-pulse rounded-full" aria-hidden />
          )}
          <span className="text-text-muted truncate text-xs">{statusLabel}</span>
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

        {/* Lo que se va reconociendo. Es provisional: al cortar, la
            transcripción del audio completo lo reemplaza. */}
        {voice.partialText && (
          <p ref={textRef} className="text-text max-h-14 overflow-y-auto text-sm leading-snug">
            {voice.partialText}
            <span className="bg-primary ml-0.5 inline-block h-3.5 w-0.5 animate-pulse align-text-bottom" aria-hidden />
          </p>
        )}
      </div>

      {isRecording && (
        <button
          ref={stopRef}
          type="button"
          onClick={voice.stop}
          aria-label="Terminar y pasar a texto"
          title="Listo"
          className={`${ICON_BUTTON} bg-primary-solid hover:bg-primary-solid-hover size-8 self-end text-white`}
        >
          <Check className="size-4" aria-hidden />
        </button>
      )}

      {/* Lectores de pantalla: se anuncia el estado y lo reconocido, pero no
          en cada frame (el texto parcial llega cada 4 s). */}
      <span className="sr-only" aria-live="polite">
        {voice.partialText || statusLabel}
      </span>
    </div>
  );
}

/** Cinco barras que siguen el volumen: muestra que el micrófono escucha. */
function LevelMeter({ level }: { level: number }) {
  const bars = [0.4, 0.75, 1, 0.75, 0.4];
  return (
    <span className="flex h-3.5 items-center gap-0.5" aria-hidden>
      {bars.map((weight, index) => (
        <span
          key={index}
          className="bg-primary w-0.5 rounded-full transition-[height] duration-75"
          style={{ height: `${Math.max(3, Math.round(14 * Math.min(1, level * weight)))}px` }}
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
