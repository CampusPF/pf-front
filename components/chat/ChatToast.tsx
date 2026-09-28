"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useChatCenter, type ChatToastData } from "@/components/chat/ChatCenterProvider";
import UserAvatar from "@/components/ui/UserAvatar";

/* Tiempo en pantalla; se pausa mientras el mouse o el foco están encima,
   para que nadie pierda el aviso mientras lo está por clickear. */
const TOAST_MS = 6000;

/* Aviso de mensaje nuevo, abajo a la derecha, arriba del launcher. No sale
   si la conversación ya está abierta (lo decide ChatCenterProvider). Click
   = abrir esa conversación. */
export default function ChatToast() {
  const { toast, dismissToast, openConversation } = useChatCenter();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-20 left-4 z-[500] flex justify-end sm:right-6 sm:bottom-24 sm:left-auto"
    >
      {toast && (
        <ToastCard
          key={toast.id}
          toast={toast}
          onOpen={() => openConversation(toast.conversationId)}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}

function ToastCard({
  toast,
  onOpen,
  onDismiss,
}: {
  toast: ChatToastData;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timeoutId = setTimeout(onDismiss, TOAST_MS);
    return () => clearTimeout(timeoutId);
  }, [paused, onDismiss]);

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="chat-toast-in bg-surface-elevated border-border pointer-events-auto relative flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3 pr-10 shadow-2xl"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
      >
        <UserAvatar name={toast.title} avatarUrl={toast.avatarUrl} className="size-10 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="text-text-muted block text-[11px] font-medium tracking-wide uppercase">
            Nuevo mensaje
          </span>
          <span className="text-text block truncate text-sm font-semibold">{toast.title}</span>
          <span className="text-text-secondary line-clamp-2 text-sm">{toast.text}</span>
          <span className="text-primary mt-1 block text-xs font-medium">Responder</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="text-text-muted hover:text-text hover:bg-surface absolute top-2 right-2 cursor-pointer rounded-lg p-1.5 transition-colors duration-150"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
