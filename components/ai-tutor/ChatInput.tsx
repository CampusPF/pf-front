"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

// ~4 líneas de texto a text-sm + el padding vertical del textarea.
const MAX_HEIGHT = 104;

export default function ChatInput({
  onSend,
}: {
  onSend: (text: string) => void;
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

  function submit() {
    if (isEmpty) return;

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
        className="bg-surface-elevated border-border text-text placeholder:text-text-muted focus:border-primary max-h-26 flex-1 resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150 outline-none"
      />

      <button
        type="submit"
        disabled={isEmpty}
        aria-label="Enviar mensaje"
        className="bg-primary-solid hover:bg-primary-solid-hover flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="size-5" aria-hidden />
      </button>
    </form>
  );
}
