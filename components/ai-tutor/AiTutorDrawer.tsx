"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Trash2, X } from "lucide-react";

import { useAiTutor } from "@/components/ai-tutor/AiTutorProvider";
import ChatInput from "@/components/ai-tutor/ChatInput";
import ChatMessage, { type ChatMessageData } from "@/components/ai-tutor/ChatMessage";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  aiTutorErrorMessage,
  createConversation,
  deleteConversation,
  findConversationForLesson,
  getUsage,
  isDailyLimitError,
  streamMessage,
} from "@/services/ai-tutor/ai-tutor.service";
import type { AiTutorMessage, AiTutorUsage } from "@/types/ai-tutor.types";

/* Conectado a pf-back (ai-tutor.service.ts): una conversación por lección,
   con corrección server-side del límite diario del plan Free.

   El saludo inicial es SÓLO de la UI (nunca se manda ni se persiste): si la
   lección ya tiene conversación se retoma su historial real; si no, se
   muestra este saludo y recién se crea la conversación con el primer mensaje
   — abrir el drawer y cerrarlo sin escribir nada no deja una fila vacía en
   la base. */
function greeting(lessonTitle: string): ChatMessageData {
  return {
    id: "greeting",
    role: "assistant",
    text: `¡Hola! Estoy leyendo "${lessonTitle}" con vos. Preguntame lo que no te cierre de esta lección.`,
  };
}

function toDisplay(message: AiTutorMessage): ChatMessageData {
  return { id: message.id, role: message.role, text: message.content };
}

type LoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

export default function AiTutorDrawer() {
  const { isOpen, close, lessonId, lessonTitle } = useAiTutor();
  const bodyRef = useRef<HTMLDivElement>(null);

  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [usage, setUsage] = useState<AiTutorUsage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Carga (o arranca de cero) la conversación de la lección actual: al abrir
  // el drawer y cada vez que se cambia de lección con el drawer abierto
  // ("Siguiente"/"Anterior") — si no, quedaría la charla de la lección vieja.
  useEffect(() => {
    if (!isOpen || !lessonId) return;
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- primera carga al abrir/cambiar de lección.
    setLoad({ status: "loading" });
    setConversationId(null);
    setMessages([]);
    setSendError(null);

    (async () => {
      try {
        const [existing, usageData] = await Promise.all([
          findConversationForLesson(lessonId),
          getUsage(),
        ]);
        if (cancelled) return;
        setUsage(usageData);

        if (existing) {
          setConversationId(existing.id);
          setMessages(
            existing.messages.length > 0
              ? existing.messages.map(toDisplay)
              : [greeting(lessonTitle ?? "")],
          );
        } else {
          setMessages([greeting(lessonTitle ?? "")]);
        }
        setLoad({ status: "ready" });
      } catch (caught) {
        if (cancelled) return;
        setLoad({
          status: "error",
          message: caught instanceof Error ? caught.message : "No pudimos cargar el tutor.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, lessonId, lessonTitle]);

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

  async function send(text: string) {
    if (!lessonId) return;

    setIsSending(true);
    setSendError(null);

    // Bubble optimista del alumno + una del tutor vacía que se va llenando
    // con el streaming. Si falla antes de que llegue texto, se sacan las dos:
    // no queda un mensaje "mío" que en verdad nunca se mandó.
    const stamp = Date.now();
    const userId = `local-user-${stamp}`;
    const replyId = `local-reply-${stamp}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text },
      { id: replyId, role: "assistant", text: "" },
    ]);

    let receivedText = false;
    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const created = await createConversation(lessonId);
        activeConversationId = created.id;
        setConversationId(activeConversationId);
      }

      await streamMessage(activeConversationId, { content: text }, (chunk) => {
        receivedText = true;
        setMessages((prev) =>
          prev.map((m) => (m.id === replyId ? { ...m, text: m.text + chunk } : m)),
        );
      });
      setUsage(await getUsage());
    } catch (caught) {
      setMessages((prev) =>
        prev.filter((m) => m.id !== replyId && (receivedText || m.id !== userId)),
      );
      if (isDailyLimitError(caught)) {
        setUsage((prev) => (prev ? { ...prev, remaining: 0 } : prev));
      }
      setSendError(aiTutorErrorMessage(caught));
    } finally {
      setIsSending(false);
    }
  }

  async function handleClear() {
    if (!conversationId) {
      setConfirmClearOpen(false);
      return;
    }

    setIsClearing(true);
    try {
      await deleteConversation(conversationId);
      setConversationId(null);
      setMessages([greeting(lessonTitle ?? "")]);
      setSendError(null);
      setConfirmClearOpen(false);
    } catch (caught) {
      setSendError(caught instanceof Error ? caught.message : "No pudimos vaciar la conversación.");
    } finally {
      setIsClearing(false);
    }
  }

  const limitReached = usage?.dailyLimit !== null && usage?.remaining === 0;

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
        // La sombra sólo abierto: cerrado, el panel queda fuera de pantalla
        // pero su shadow-2xl asomaba como una franja gris en el borde derecho.
        className={`bg-surface border-border fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l transition-[translate,box-shadow] duration-300 sm:w-96 ${
          isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"
        }`}
      >
        <header className="border-border flex min-h-14 shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="min-w-0">
            <p className="text-text flex items-center gap-2 text-sm font-medium">
              <Sparkles className="text-primary size-5 shrink-0" aria-hidden />
              <span className="truncate">Tutor IA</span>
              <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
                Beta
              </span>
            </p>
            {/* Plan pago (docente/admin incluidos): dailyLimit null, no hay nada que mostrar. */}
            {load.status === "ready" && usage && usage.dailyLimit !== null && (
              <p className={`mt-0.5 text-xs ${limitReached ? "text-danger" : "text-text-muted"}`}>
                {usage.remaining} de {usage.dailyLimit} mensajes hoy
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {conversationId && (
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                aria-label="Vaciar conversación"
                title="Vaciar conversación"
                className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar tutor IA"
              className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </header>

        {!lessonId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <Sparkles className="text-text-muted size-10" aria-hidden />
            <p className="text-text text-sm font-medium">El tutor está disponible dentro de cada lección</p>
            <p className="text-text-secondary text-sm">
              Abrí cualquier lección de tus cursos y preguntale lo que necesites sobre ese contenido.
            </p>
            <Link
              href="/dashboard/mis-cursos"
              onClick={close}
              className="text-primary text-sm font-medium hover:underline"
            >
              Ir a mis cursos
            </Link>
          </div>
        ) : load.status === "loading" ? (
          <div className="flex flex-1 items-center justify-center gap-2">
            <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
            <span className="text-text-muted text-sm">Cargando…</span>
          </div>
        ) : load.status === "error" ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-text-secondary text-sm">{load.message}</p>
          </div>
        ) : (
          <>
            <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>

            {sendError && (
              <p role="alert" className="text-danger border-border shrink-0 border-t px-4 py-2 text-xs">
                {sendError}
              </p>
            )}

            {limitReached ? (
              <div className="border-border shrink-0 border-t px-4 py-3 text-center">
                <p className="text-text-secondary text-xs">
                  Alcanzaste tu límite diario de mensajes gratis con el tutor.
                </p>
                <Link
                  href="/#planes"
                  onClick={close}
                  className="text-primary mt-1 inline-block text-xs font-medium hover:underline"
                >
                  Ver planes
                </Link>
              </div>
            ) : (
              <ChatInput onSend={send} isSending={isSending} />
            )}
          </>
        )}
      </aside>

      <ConfirmDialog
        open={confirmClearOpen}
        variant="danger"
        title="¿Vaciar esta conversación?"
        description="Se borran todos los mensajes de este chat sobre la lección. No se puede deshacer."
        confirmLabel="Sí, vaciar"
        cancelLabel="Cancelar"
        isPending={isClearing}
        onConfirm={handleClear}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </>
  );
}
