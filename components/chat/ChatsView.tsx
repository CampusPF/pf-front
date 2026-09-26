"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, MessageCircle } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import ChatConversationList from "@/components/chat/ChatConversationList";
import ChatThread from "@/components/chat/ChatThread";
import {
  chatRoleFor,
  getMyConversations,
  isChatAvailable,
  markConversationRead,
  toCurrentParticipant,
} from "@/services/chat/chat.service";
import type { ChatConversation } from "@/types/chat.types";

const LIST_POLL_MS = 5000;

/* pb del topbar (4rem) + aire para que el FAB del tutor IA (fixed
   bottom-4/6, ver AiTutorFAB) no tape el composer en mobile. En lg+ el FAB
   nunca se superpone al layout de dos columnas, así que ahí alcanza con el
   topbar. */
const PANEL_HEIGHT = "h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-4rem)]";

/* Chat en vivo: sala grupal por curso + un directo con el docente (o, si sos
   docente, uno por alumno). Todo contra mocks por ahora — ver
   services/chat/chat.service.ts, que es el único archivo a cambiar cuando el
   back exista.

   Maestro-detalle simple: en desktop, lista + hilo lado a lado; en mobile,
   uno a la vez con "Volver" desde el hilo. La selección vive en estado local
   (no en la URL): todavía no hace falta que una conversación sea un link
   compartible. */
export default function ChatsView() {
  const { user, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = chatRoleFor(user?.role);

  const reload = useCallback(async () => {
    if (!user || !role) return;
    try {
      const data = await getMyConversations(user, role);
      setConversations(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar tus conversaciones.");
    }
  }, [user, role]);

  // El polling de la lista mantiene actualizados el último mensaje y las
  // insignias de "sin leer" aunque no se esté mirando ninguna conversación.
  useEffect(() => {
    if (!user || !role || !isChatAvailable()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- primera carga al montar, mismo criterio que el resto del dashboard.
    void reload();
    const interval = setInterval(reload, LIST_POLL_MS);
    return () => clearInterval(interval);
  }, [user, role, reload]);

  function handleSelect(conversation: ChatConversation) {
    setSelectedId(conversation.id);
    if (conversation.unreadCount > 0) {
      markConversationRead(conversation.id);
      setConversations((prev) =>
        prev ? prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c)) : prev,
      );
    }
  }

  if (authLoading) {
    return (
      <div className={`flex items-center justify-center gap-2 ${PANEL_HEIGHT}`}>
        <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
        <span className="text-text-muted text-sm">Cargando…</span>
      </div>
    );
  }

  // RequireAuth (en el layout) ya garantiza sesión: esto es sólo para que
  // TypeScript sepa que `user` no es null de acá en adelante.
  if (!user) return null;

  if (!role) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 px-6 text-center ${PANEL_HEIGHT}`}>
        <MessageCircle className="text-text-muted size-10" aria-hidden />
        <h1 className="text-text text-lg font-semibold">El chat es para alumnos y docentes</h1>
        <p className="text-text-secondary max-w-sm text-sm">
          Por tu rol no tenés cursos ni alumnos con quien chatear acá.
        </p>
      </div>
    );
  }

  if (!isChatAvailable()) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 px-6 text-center ${PANEL_HEIGHT}`}>
        <MessageCircle className="text-text-muted size-10" aria-hidden />
        <h1 className="text-text text-lg font-semibold">El chat en vivo todavía no está disponible</h1>
        <p className="text-text-secondary max-w-sm text-sm">
          Estamos terminando de conectarlo. Volvé a intentar más adelante.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center px-6 ${PANEL_HEIGHT}`}>
        <p
          role="alert"
          className="bg-danger-subtle text-danger border-danger/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      </div>
    );
  }

  if (conversations === null) {
    return (
      <div className={`flex items-center justify-center gap-2 ${PANEL_HEIGHT}`}>
        <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
        <span className="text-text-muted text-sm">Cargando tus conversaciones…</span>
      </div>
    );
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const me = toCurrentParticipant(user, role);

  return (
    <div className={`lg:grid lg:grid-cols-[320px_1fr] ${PANEL_HEIGHT}`}>
      {/* Lista: se oculta en mobile en cuanto hay una conversación abierta. */}
      <aside
        className={`border-border bg-surface overflow-y-auto border-r lg:block ${PANEL_HEIGHT} ${
          selected ? "hidden" : "block"
        }`}
      >
        <div className="border-border bg-surface sticky top-0 z-10 border-b px-4 py-3">
          <h1 className="text-text text-lg font-semibold">Chats</h1>
        </div>
        <ChatConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </aside>

      {/* Hilo: en mobile, sólo si hay selección. En desktop, un estado vacío si no. */}
      <div className={`min-h-0 ${PANEL_HEIGHT} ${selected ? "block" : "hidden lg:block"}`}>
        {selected ? (
          <ChatThread conversation={selected} me={me} onBack={() => setSelectedId(null)} />
        ) : (
          <div className="text-text-muted hidden h-full flex-col items-center justify-center gap-2 lg:flex">
            <MessageCircle className="size-10" aria-hidden />
            <p className="text-sm">Elegí una conversación para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}
