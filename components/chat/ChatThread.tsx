"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";

import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  getMessages,
  markConversationRead,
  sendMessage,
  subscribeToMessages,
} from "@/services/chat/chat.service";
import type { ChatConversation, ChatMessage, ChatParticipant } from "@/types/chat.types";

export default function ChatThread({
  conversation,
  me,
  onBack,
  alwaysShowBack = false,
  headerAction,
}: {
  /** Botón extra a la derecha del header (el panel pone ahí "Cerrar"). */
  headerAction?: React.ReactNode;
  conversation: ChatConversation;
  me: ChatParticipant;
  /** Vuelve a la lista. En la página sólo se ve en mobile (en desktop la
      lista está al lado); en el panel lateral, siempre (`alwaysShowBack`). */
  onBack?: () => void;
  alwaysShowBack?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(null);
    setError(null);
    markConversationRead(conversation.id);

    async function load() {
      try {
        const data = await getMessages(conversation, me);
        if (!cancelled) setMessages(data);
      } catch (caught) {
        if (!cancelled) {
          setMessages([]);
          setError(caught instanceof Error ? caught.message : "No pudimos cargar los mensajes.");
        }
      }
    }

    void load();

    const otherId = conversation.otherParticipant?.id;
    const unsubscribe = subscribeToMessages((raw) => {
      // Sólo los mensajes entre yo y quien está del otro lado de ESTA
      // conversación (el socket entrega los de todas las conversaciones).
      const belongsHere =
        (raw.senderId === me.id && raw.receiverId === otherId) ||
        (raw.senderId === otherId && raw.receiverId === me.id);
      if (!belongsHere) return;

      setMessages((prev) => {
        const list = prev ?? [];
        // El propio mensaje enviado ya lo agrega handleSend con lo que
        // devuelve sendMessage; acá se evita duplicarlo.
        if (list.some((m) => m.id === raw.id)) return list;
        const author = raw.senderId === me.id ? me : (conversation.otherParticipant ?? me);
        return [...list, { id: raw.id, conversationId: conversation.id, author, text: raw.content, sentAt: raw.createdAt }];
      });

      if (raw.senderId === otherId) markConversationRead(conversation.id);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // Sólo conversation.id: ChatCenterProvider reconstruye `conversation` (objeto
    // nuevo, mismo id) cada vez que refresca la lista de contactos, y no
    // hay que reiniciar el hilo (mensajes a null de nuevo) por eso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function handleSend(text: string) {
    setIsSending(true);
    setError(null);
    try {
      const sent = await sendMessage(conversation, me, text);
      // El mismo mensaje puede llegar también por `message:new` (ver el
      // efecto de arriba): se evita duplicarlo si ya está.
      setMessages((prev) => {
        const list = prev ?? [];
        return list.some((m) => m.id === sent.id) ? list : [...list, sent];
      });
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
            className={`text-text-secondary hover:text-text hover:bg-surface-elevated -ml-1 cursor-pointer rounded-lg p-1.5 transition-colors duration-150 ${alwaysShowBack ? "" : "lg:hidden"}`}
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

        <div className="min-w-0 flex-1">
          <p className="text-text truncate text-sm font-semibold">{conversation.title}</p>
          <p className="text-text-muted truncate text-xs">{conversation.subtitle}</p>
        </div>

        {headerAction}
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

      <ChatComposer
        onSend={handleSend}
        isSending={isSending}
        voiceContext={conversation.courseTitle || null}
      />
    </div>
  );
}
