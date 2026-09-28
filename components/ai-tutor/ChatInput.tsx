"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square } from "lucide-react";

// ~4 líneas de texto a text-sm + el padding vertical del textarea.
const MAX_HEIGHT = 104;

export default function ChatInput({
  onSend,
  disabled = false,
  isSending = false,
  onStop,
}: {
  onSend: (text: string) => void;
  /** Mientras responde, el botón pasa a "Detener respuesta" y llama a esto. */
  onStop?: () => void;
  /** El tutor no está disponible ahora mismo (sin lección, límite diario alcanzado). */
  disabled?: boolean;
  /** Esperando la respuesta del mensaje anterior. */
  isSending?: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // El textarea crece con el contenido hasta 4 líneas; después scrollea adentro.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const isEmpty = value.trim().length === 0;
  const isDisabled = disabled || isSending;

  function submit() {
    if (isEmpty || isDisabled) return;

    onSend(value.trim());
    setValue("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="border-border bg-surface flex items-end gap-2 border-t p-3"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          // Enter envía, Shift+Enter hace salto de línea.
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Preguntale algo sobre esta lección…"
        aria-label="Mensaje para el tutor IA"
        disabled={isDisabled}
        className="bg-surface-elevated border-border text-text placeholder:text-text-muted focus:border-primary max-h-26 flex-1 resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150 outline-none disabled:opacity-60"
      />

      {isSending && onStop ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Detener respuesta"
          title="Detener respuesta"
          className="bg-surface-elevated border-border text-text hover:bg-surface flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-150"
        >
          <Square className="size-4 fill-current" aria-hidden />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isEmpty || isDisabled}
          aria-label="Enviar mensaje"
          className="bg-primary-solid hover:bg-primary-solid-hover flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="size-5" aria-hidden />
        </button>
      )}
    </form>
  );
}
