"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, LoaderCircle, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  useNotificationsCenter,
  type ChatNotification,
} from "@/components/notifications/NotificationsCenterProvider";
import type { AppNotification } from "@/services/notifications/notifications.service";

/* La campana, montada en el topbar del dashboard, en la navbar pública y en
   el header del reproductor. Todo el estado vive en NotificationsCenterProvider
   (root layout), así que las tres instancias muestran siempre lo mismo y el
   polling se hace una sola vez.

   `align` existe porque en la navbar y en el player la campana está cerca del
   borde derecho y el panel se saldría de pantalla. */
export default function NotificationsBell({
  align = "right",
}: {
  align?: "right" | "left";
}) {
  const { user } = useAuth();
  const router = useRouter();
  const {
    serverNotifications,
    chatNotifications,
    unreadCount,
    openServerNotification,
    openChatNotification,
    clearAll,
    pushSupported,
    pushBlocked,
    pushState,
    pushError,
    pushConfirmation,
    togglePush,
  } = useNotificationsCenter();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  // Sin sesión no hay nada que notificar: la campana no se muestra.
  if (!user) return null;

  const isEmpty = serverNotifications.length === 0 && chatNotifications.length === 0;

  async function handleServerClick(notification: AppNotification) {
    setOpen(false);
    await openServerNotification(notification);
    if (notification.link) router.push(notification.link);
  }

  function handleChatClick(notification: ChatNotification) {
    setOpen(false);
    openChatNotification(notification);
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="text-text-secondary hover:text-text hover:bg-surface-elevated relative cursor-pointer rounded-lg p-2 transition-colors duration-150"
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 && (
          <span className="bg-danger absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        /* En mobile va FIJO al viewport y no colgado del botón: la campana
           tiene otros íconos a su derecha, así que un `absolute right-0` se
           extendía hacia la izquierda y se salía de la pantalla (limitar el
           ancho no alcanza — el problema es dónde empieza). Desde `sm` sí
           cuelga del botón, que es lo natural en desktop. */
        <section
          aria-label="Notificaciones"
          className={`bg-surface border-border fixed inset-x-4 top-18 z-50 overflow-hidden rounded-lg border shadow-xl sm:absolute sm:top-full sm:mt-2 sm:w-88 ${
            align === "right" ? "sm:inset-x-auto sm:right-0" : "sm:inset-x-auto sm:left-0"
          }`}
        >
          <div className="border-border border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-text text-sm font-semibold">Notificaciones</h2>
              {!isEmpty && (
                <button
                  type="button"
                  onClick={clearAll}
                  aria-label="Marcar todas como leídas"
                  title="Marcar todas como leídas"
                  className="text-text-muted hover:text-text cursor-pointer rounded p-1"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </div>

            {pushSupported && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-text-secondary text-sm">
                  Notificaciones del navegador
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pushState === "on"}
                  aria-label="Notificaciones del navegador"
                  disabled={pushState === "unknown" || pushBlocked}
                  onClick={() => void togglePush(pushState)}
                  className={`relative flex h-6 w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    pushState === "on" ? "bg-primary" : "bg-border"
                  }`}
                >
                  {pushState === "unknown" ? (
                    <LoaderCircle
                      className="size-4 animate-spin text-white"
                      aria-label="Verificando"
                    />
                  ) : (
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                        pushState === "on" ? "translate-x-2.5" : "-translate-x-2.5"
                      }`}
                    />
                  )}
                </button>
              </div>
            )}

            {pushBlocked && (
              <p className="text-danger mt-2 text-xs">
                Bloqueaste las notificaciones. Habilitalas en la configuración del
                navegador.{" "}
                <a
                  href="https://support.google.com/chrome/answer/3220216"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  ¿Cómo activarlas?
                </a>
              </p>
            )}
            {pushError && (
              <p role="alert" className="text-danger mt-2 text-xs">
                {pushError}
              </p>
            )}
            {pushConfirmation && (
              <p role="status" className="text-success mt-2 text-xs">
                {pushConfirmation}
              </p>
            )}
          </div>

          {/* En mobile el panel arranca debajo del header, así que el alto se
              mide contra la pantalla; en desktop alcanza con un tope fijo. */}
          <div className="max-h-[60vh] overflow-y-auto sm:max-h-80">
            {isEmpty ? (
              <p className="text-text-muted px-4 py-8 text-center text-sm">
                No tenés notificaciones nuevas.
              </p>
            ) : (
              <>
                {serverNotifications.map((notification) => (
                  <button
                    type="button"
                    key={`server-${notification.id}`}
                    onClick={() => void handleServerClick(notification)}
                    className="border-border hover:bg-surface-elevated flex w-full cursor-pointer items-start gap-3 border-b px-4 py-3 text-left last:border-0"
                  >
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        notification.read ? "bg-border" : "bg-primary"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-text block text-sm font-medium">
                        {notification.title}
                      </span>
                      <span className="text-text-secondary mt-0.5 block truncate text-sm">
                        {notification.message}
                      </span>
                    </span>
                    {notification.read && (
                      <Check className="text-text-muted size-4 shrink-0" aria-label="Leída" />
                    )}
                  </button>
                ))}

                {chatNotifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => handleChatClick(notification)}
                    className="border-border hover:bg-surface-elevated flex w-full cursor-pointer items-start gap-3 border-b px-4 py-3 text-left last:border-0"
                  >
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        notification.read ? "bg-border" : "bg-primary"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-text block text-sm font-medium">
                        Nuevo mensaje recibido
                      </span>
                      <span className="text-text-secondary mt-0.5 block truncate text-sm">
                        {notification.body}
                      </span>
                    </span>
                    {notification.read && (
                      <Check className="text-text-muted size-4 shrink-0" aria-label="Leída" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
