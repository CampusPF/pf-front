"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { MicButton, RecordingBar, VoiceError, appendDictation } from "@/components/voice/VoiceControls";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

/* Mismo comportamiento que components/ai-tutor/ChatInput.tsx (Enter envía,
   Shift+Enter hace salto de línea, crece hasta 4 líneas) pero sin acoplarse
   a ese componente: son dos features sin relación, y el tutor IA puede
   cambiar su input sin arrastrar al chat con el docente. */
const MAX_HEIGHT = 104;

export default function ChatComposer({
  onSend,
  isSending = false,
  voiceContext = null,
}: {
  onSend: (text: string) => void;
  isSending?: boolean;
  /** Curso en común: vocabulario para el dictado por voz. */
  voiceContext?: string | null;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  // Igual que en el tutor: lo dictado se suma al campo y queda para revisar.
  const handleTranscript = useCallback((text: string) => {
    setValue((current) => appendDictation(current, text));
    requestAnimationFrame(() => {
      const element = textareaRef.current;
      if (!element) return;
      element.focus();
      element.setSelectionRange(element.value.length, element.value.length);
    });
  }, []);
  const voice = useVoiceRecorder({ onTranscript: handleTranscript, context: voiceContext });

  const isEmpty = value.trim().length === 0;

  function submit() {
    if (isEmpty || isSending || voice.isActive) return;
    onSend(value.trim());
    setValue("");
    voice.clearError();
  }

  return (
    <div className="border-border bg-surface shrink-0 border-t">
    <VoiceError voice={voice} />
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 p-3"
    >
      {voice.isActive ? (
        <RecordingBar voice={voice} />
      ) : (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Escribí o dictá un mensaje…"
        aria-label="Mensaje"
        disabled={isSending}
        className="bg-surface-elevated border-border text-text placeholder:text-text-muted focus:border-primary max-h-26 flex-1 resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150 outline-none disabled:opacity-60"
      />
      )}

      {!voice.isActive && <MicButton voice={voice} disabled={isSending} />}

      <button
        type="submit"
        disabled={isEmpty || isSending || voice.isActive}
        aria-label="Enviar mensaje"
        className="bg-primary-solid hover:bg-primary-solid-hover flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Send className="size-5" aria-hidden />
        )}
      </button>
    </form>
    </div>
  );
}
