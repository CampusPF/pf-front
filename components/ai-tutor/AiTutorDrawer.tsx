"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { useAiTutor } from "@/components/ai-tutor/AiTutorProvider";
import ChatInput from "@/components/ai-tutor/ChatInput";
import ChatMessage, {
  type ChatMessageData,
} from "@/components/ai-tutor/ChatMessage";

const SAMPLE_CODE = `let contador = 0;
contador = 1;        // ✅ se puede reasignar

const limite = 10;
limite = 20;         // ❌ TypeError: Assignment to constant variable`;

export default function AiTutorDrawer({ lessonTitle }: { lessonTitle: string }) {
  const { isOpen, close } = useAiTutor();
  const bodyRef = useRef<HTMLDivElement>(null);

  /* TODO(campus): conversación mockeada. Cuando exista el endpoint del tutor,
     `send` pasa a llamarlo con el contexto de la lección y a hacer streaming
     de la respuesta. */
  const [messages, setMessages] = useState<ChatMessageData[]>(() => [
    {
      id: "1",
      role: "tutor",
      text: `¡Hola! Estoy leyendo "${lessonTitle}" con vos. Preguntame lo que no te cierre y te lo explico con el contexto de esta lección.`,
    },
    {
      id: "2",
      role: "user",
      text: "¿Cuál es la diferencia entre let y const?",
    },
    {
      id: "3",
      role: "tutor",
      text: "Las dos declaran variables de bloque. La diferencia está en la reasignación: con let podés apuntar la variable a otro valor, con const no.",
      code: SAMPLE_CODE,
    },
  ]);

  // ESC cierra el drawer.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Siempre mostrar el último mensaje.
  useEffect(() => {
    const element = bodyRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, isOpen]);

  function send(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}`, role: "user", text },
    ]);
  }

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label="Cerrar tutor IA"
        onClick={close}
        tabIndex={isOpen ? 0 : -1}
        className={`fixed inset-0 z-50 cursor-pointer bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* ── Panel ───────────────────────────────────────────────── */}
      <aside
        aria-label="Tutor IA"
        inert={!isOpen}
        className={`bg-surface border-border fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l shadow-2xl transition-transform duration-300 sm:w-96 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="border-border flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
          <p className="text-text flex min-w-0 items-center gap-2 text-sm font-medium">
            <Sparkles className="text-primary size-5 shrink-0" aria-hidden />
            <span className="truncate">Tutor IA</span>
            <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
              Sonnet 3.5
            </span>
          </p>

          <button
            type="button"
            onClick={close}
            aria-label="Cerrar tutor IA"
            className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>

        <ChatInput onSend={send} />
      </aside>
    </>
  );
}
