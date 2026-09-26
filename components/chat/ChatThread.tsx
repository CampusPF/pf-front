"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";

import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import UserAvatar from "@/components/ui/UserAvatar";
import { getMessages, markConversationRead, sendMessage } from "@/services/chat/chat.service";
import type { ChatConversation, ChatMessage, ChatParticipant } from "@/types/chat.types";

/* Sin WebSocket todavía: los mensajes nuevos llegan por polling. Es el mismo
   criterio que otras partes del front (progreso, dashboard) y el lugar
   natural para cambiar por una suscripción en tiempo real cuando el back
   la tenga — el resto del componente no se entera del cambio. */
const POLL_MS = 3000;

export default function ChatThread({
  conversation,
  me,
  onBack,
}: {
  conversation: ChatConversation;
  me: ChatParticipant;
  /** Sólo se ve en mobile (el botón vuelve a la lista). */
  onBack?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(null);
    markConversationRead(conversation.id);

    async function poll() {
      const data = await getMessages(conversation.id);
      if (!cancelled) setMessages(data);
    }

    void poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function handleSend(text: string) {
    setIsSending(true);
    setError(null);
    try {
      const sent = await sendMessage(conversation.id, me, text);
      setMessages((prev) => [...(prev ?? []), sent]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-border bg-surface flex shrink-0 items-center gap-3 border-b px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a las conversaciones"
            className="text-text-secondary hover:text-text hover:bg-surface-elevated -ml-1 cursor-pointer rounded-lg p-1.5 transition-colors duration-150 lg:hidden"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        )}

        {conversation.kind === "group" ? (
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
            <Users className="size-4.5" aria-hidden />
          </span>
        ) : (
          <UserAvatar name={conversation.title} avatarUrl={conversation.avatarUrl} />
        )}

        <div className="min-w-0">
          <p className="text-text truncate text-sm font-semibold">{conversation.title}</p>
          <p className="text-text-muted truncate text-xs">{conversation.subtitle}</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages === null ? (
          <p className="text-text-muted py-8 text-center text-sm">Cargando…</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MessageCircle className="text-text-muted size-8" aria-hidden />
            <p className="text-text-muted text-sm">Todavía no hay mensajes. Escribí el primero.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              isMine={message.author.id === me.id}
              showAuthor={conversation.kind === "group" && message.author.id !== me.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="text-danger border-border shrink-0 border-t px-4 py-2 text-xs">
          {error}
        </p>
      )}

      <ChatComposer onSend={handleSend} isSending={isSending} />
    </div>
  );
}
