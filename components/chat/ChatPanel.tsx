"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, Maximize2, X } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { CHATS_PAGE_PATH, useChatCenter } from "@/components/chat/ChatCenterProvider";
import ChatConversationList from "@/components/chat/ChatConversationList";
import ChatThread from "@/components/chat/ChatThread";
import { toCurrentParticipant } from "@/services/chat/chat.service";

/* Chat en un panel lateral, para contestar sin salir de lo que se está
   haciendo (una lección, el catálogo). Una columna: lista → hilo, con
   "Volver". Mismo estado que la página /dashboard/chats (ChatCenterProvider):
   lo que se lee acá deja de figurar como "sin leer" también allá.

   A diferencia del drawer del tutor, el foco entra al panel al abrirlo y
   vuelve al botón que lo abrió al cerrarlo. */
export default function ChatPanel() {
  const { user } = useAuth();
  const {
    enabled,
    role,
    conversations,
    error,
    selectedId,
    selectConversation,
    isPanelOpen,
    closePanel,
  } = useChatCenter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isPanelOpen) return;
    openerRef.current = document.activeElement;
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [isPanelOpen, closePanel]);

  if (!enabled || !user || !role) return null;

  const selected = conversations?.find((c) => c.id === selectedId) ?? null;
  const me = toCurrentParticipant(user, role);

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar mensajes"
        onClick={closePanel}
        tabIndex={-1}
        className={`fixed inset-0 z-50 cursor-pointer bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isPanelOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mensajes"
        inert={!isPanelOpen}
        className={`bg-surface border-border fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l transition-[translate,box-shadow] duration-300 sm:w-100 ${
          isPanelOpen ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"
        }`}
      >
        {!selected && (
          <header className="border-border flex min-h-14 shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
            <h2 className="text-text text-base font-semibold">Mensajes</h2>
            <div className="flex items-center gap-1">
              <Link
                href={CHATS_PAGE_PATH}
                aria-label="Abrir en pantalla completa"
                title="Abrir en pantalla completa"
                className="text-text-secondary hover:text-text hover:bg-surface-elevated rounded-lg p-2 transition-colors duration-150"
              >
                <Maximize2 className="size-4" aria-hidden />
              </Link>
              <button
                ref={closeRef}
                type="button"
                onClick={closePanel}
                aria-label="Cerrar mensajes"
                className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          </header>
        )}

        <div className={`min-h-0 flex-1 ${selected ? "" : "overflow-y-auto"}`}>
          {selected ? (
            <ChatThread
              conversation={selected}
              me={me}
              onBack={() => selectConversation(null)}
              alwaysShowBack
              headerAction={
                <button
                  ref={closeRef}
                  type="button"
                  onClick={closePanel}
                  aria-label="Cerrar mensajes"
                  className="text-text-secondary hover:text-text hover:bg-surface-elevated -mr-1 shrink-0 cursor-pointer rounded-lg p-2 transition-colors duration-150"
                >
                  <X className="size-5" aria-hidden />
                </button>
              }
            />
          ) : conversations === null ? (
            error ? (
              <p role="alert" className="text-danger px-6 py-10 text-center text-sm">
                {error}
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2 py-10">
                <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
                <span className="text-text-muted text-sm">Cargando tus conversaciones…</span>
              </div>
            )
          ) : (
            <ChatConversationList
              conversations={conversations}
              selectedId={selectedId}
              role={role}
              onSelect={(conversation) => selectConversation(conversation.id)}
            />
          )}
        </div>
      </aside>
    </>
  );
}
