"use client";

import { AlertCircle, Loader2, MessageCircle } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useChatCenter } from "@/components/chat/ChatCenterProvider";
import ChatConversationList from "@/components/chat/ChatConversationList";
import ChatThread from "@/components/chat/ChatThread";
import { toCurrentParticipant } from "@/services/chat/chat.service";

/* Alto disponible: topbar (4rem) + el pb-14 que DashboardShell le pone al
   <main> en mobile. El launcher flotante no aparece en esta página (ver
   FloatingLauncher), así que ya no tapa el composer. */
const PANEL_HEIGHT = "h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-4rem)]";

/* Chat en vivo: un directo con el docente (o, si sos docente, uno por
   alumno) por cada curso activo en común. Los datos (lista, no leídos,
   selección) los tiene ChatCenterProvider, compartidos con el panel lateral
   y el launcher: esta página es sólo la vista grande.

   Maestro-detalle simple: en desktop, lista + hilo lado a lado; en mobile,
   uno a la vez con "Volver" desde el hilo. */
export default function ChatsView() {
  const { user, isLoading: authLoading } = useAuth();
  const { role, conversations, error, selectedId, selectConversation } = useChatCenter();

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

  if (error && conversations === null) {
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
          role={role}
          onSelect={(conversation) => selectConversation(conversation.id)}
        />
      </aside>

      {/* Hilo: en mobile, sólo si hay selección. En desktop, un estado vacío si no. */}
      <div className={`min-h-0 ${PANEL_HEIGHT} ${selected ? "block" : "hidden lg:block"}`}>
        {selected ? (
          <ChatThread conversation={selected} me={me} onBack={() => selectConversation(null)} />
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
