"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Flame, LoaderCircle, Menu, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { useChatCenter } from "@/components/chat/ChatCenterProvider";
import { onNewMessage } from "@/services/chat/chat.socket";
import {
  isPushEnabled,
  isPushSupported,
  registerPush,
  unregisterPush,
} from "@/services/push/push.service";
import { useStreak } from "@/services/progress/use-progress-stats";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/services/notifications/notifications.service";

interface BellNotification {
  id: string;
  conversationId: string;
  body: string;
  read: boolean;
}

type PushState = "on" | "off" | "unknown";

export default function DashboardTopbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { enabled: chatEnabled, selectedId, isPanelOpen, openConversation } = useChatCenter();
  /* Píldora de racha: sólo con racha real > 0. Cargando, en cero o con error
     no se muestra — el detalle (vacío / error) lo da StreakCard. */
  const streakState = useStreak();
  const streakDays = streakState.status === "success" ? streakState.value : 0;
  const streak =
    streakDays > 0 ? `${streakDays} ${streakDays === 1 ? "día" : "días"}` : "";
  const [notifications, setNotifications] = useState<BellNotification[]>([]);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushState, setPushState] = useState<PushState>("unknown");
  const [pushChecking, setPushChecking] = useState(true);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushConfirmation, setPushConfirmation] = useState<string | null>(null);
  const [pushConfirmationFading, setPushConfirmationFading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [serverNotifications, setServerNotifications] = useState<AppNotification[]>([]);
  const unreadChat = notifications.filter((notification) => !notification.read).length;
  const unreadServer = serverNotifications.filter((notification) => !notification.read).length;
  const unreadNotifications = unreadChat + unreadServer;

  /* eslint-disable react-hooks/set-state-in-effect -- sincroniza con APIs del navegador (localStorage, Notification) */
  useEffect(() => {
    setPushSupported(isPushSupported());
    setPushChecking(true);
    if (!user?.id) {
      setPushState("off");
      setPushChecking(false);
      return;
    }

    const storageKey = `push-enabled:${user.id}`;
    const cachedState = localStorage.getItem(storageKey);
    if (cachedState === "on" || cachedState === "off") setPushState(cachedState);
    if (isPushSupported() && Notification.permission === "denied") {
      setPushState("off");
      localStorage.setItem(storageKey, "off");
      setPushChecking(false);
      return;
    }

    let active = true;
    const verify = async () => {
      const enabled = await isPushEnabled();
      if (!active) return;
      const nextState: PushState =
        isPushSupported() && Notification.permission === "denied"
          ? "off"
          : enabled
            ? "on"
            : "off";
      setPushState(nextState);
      localStorage.setItem(storageKey, nextState);
      setPushChecking(false);
    };
    void verify();

    function syncFromOtherTab(event: StorageEvent) {
      if (event.key !== storageKey) return;
      setPushState(
        isPushSupported() && Notification.permission === "denied"
          ? "off"
          : event.newValue === "on"
            ? "on"
            : "off",
      );
    }
    function verifyWhenVisible() {
      if (document.visibilityState === "visible") void verify();
    }
    window.addEventListener("storage", syncFromOtherTab);
    window.addEventListener("focus", verifyWhenVisible);
    document.addEventListener("visibilitychange", verifyWhenVisible);
    return () => {
      active = false;
      window.removeEventListener("storage", syncFromOtherTab);
      window.removeEventListener("focus", verifyWhenVisible);
      document.removeEventListener("visibilitychange", verifyWhenVisible);
    };
  }, [user?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!pushConfirmation) return;
    const fadeId = window.setTimeout(() => setPushConfirmationFading(true), 2_500);
    const clearId = window.setTimeout(() => setPushConfirmation(null), 3_000);
    return () => {
      window.clearTimeout(fadeId);
      window.clearTimeout(clearId);
    };
  }, [pushConfirmation]);

  // Sólo con el chat habilitado: si no, suscribirse abriría un socket propio.
  useEffect(() => chatEnabled ? onNewMessage((payload) => {
    if (!payload || typeof payload !== "object") return;
    const message = payload as Record<string, unknown>;
    if (
      typeof message.id !== "string" ||
      typeof message.senderId !== "string" ||
      typeof message.receiverId !== "string" ||
      typeof message.content !== "string" ||
      message.receiverId !== user?.id
    ) return;

    const conversationId = `direct-${message.senderId}`;
    const conversationIsOpen =
      selectedId === conversationId && (isPanelOpen || pathname === "/dashboard/chats");
    if (conversationIsOpen) return;

    setNotifications((current) => [
      { id: message.id as string, conversationId, body: message.content as string, read: false },
      ...current.filter((notification) => notification.id !== message.id),
    ].slice(0, 20));
  }) : undefined, [chatEnabled, user?.id, selectedId, isPanelOpen, pathname]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !dropdownRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  async function togglePush() {
    const previousState = pushState;
    setPushState("unknown");
    setPushError(null);
    setPushConfirmation(null);
    setPushConfirmationFading(false);
    try {
      if (previousState === "on") {
        await unregisterPush();
        setPushState("off");
        if (user?.id) localStorage.setItem(`push-enabled:${user.id}`, "off");
        setPushConfirmation("Notificaciones desactivadas");
      } else {
        const enabled = await registerPush();
        const nextState: PushState = enabled ? "on" : "off";
        setPushState(nextState);
        if (user?.id) localStorage.setItem(`push-enabled:${user.id}`, nextState);
        setPushConfirmation(enabled ? "Notificaciones activadas" : null);
      }
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "No pudimos actualizar las notificaciones.");
      setPushState(previousState);
      if (user?.id) localStorage.setItem(`push-enabled:${user.id}`, previousState);
    }
  }

  /* Avisos del backend (foros). Se cargan al montar, al abrir la campanita y
     cada minuto. Si la API falla, la campanita sigue mostrando el chat. */
  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    const load = () => {
      listMyNotifications(1, controller.signal)
        .then((result) => setServerNotifications(result.data))
        .catch(() => undefined);
    };
    load();
    const interval = window.setInterval(load, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [user?.id, dropdownOpen]);

  async function openServerNotification(notification: AppNotification) {
    setServerNotifications((current) => current.map((item) =>
      item.id === notification.id ? { ...item, read: true } : item,
    ));
    setDropdownOpen(false);
    if (!notification.read) {
      await markNotificationRead(notification.id).catch(() => undefined);
    }
    if (notification.link) router.push(notification.link);
  }

  async function markAllServerRead() {
    setServerNotifications((current) => current.map((item) => ({ ...item, read: true })));
    await markAllNotificationsRead().catch(() => undefined);
  }

  function openNotification(notification: BellNotification) {
    setNotifications((current) => current.map((item) =>
      item.id === notification.id ? { ...item, read: true } : item,
    ));
    setDropdownOpen(false);
    openConversation(notification.conversationId);
  }

  return (
    <header className="bg-surface/80 border-border sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      {/* Hamburguesa: sólo mobile/tablet */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150 lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Racha */}
        {streak && (
          <span className="bg-accent-subtle text-accent hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium sm:flex">
            <Flame className="size-4" aria-hidden />
            {streak}
          </span>
        )}

        {/* Notificaciones */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            aria-label="Notificaciones"
            aria-expanded={dropdownOpen}
            onClick={() => setDropdownOpen((open) => !open)}
            className="text-text-secondary hover:text-text hover:bg-surface-elevated relative cursor-pointer rounded-lg p-2 transition-colors duration-150"
          >
            <Bell className="size-5" aria-hidden />
            {unreadNotifications > 0 && (
              <span className="bg-danger text-white absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
          {dropdownOpen && (
            <section className="bg-surface border-border absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border shadow-xl" aria-label="Notificaciones">
              <div className="border-border border-b px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-text text-sm font-semibold">Notificaciones</h2>
                  {(notifications.length > 0 || unreadServer > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotifications([]);
                        void markAllServerRead();
                      }}
                      aria-label="Limpiar notificaciones"
                      title="Limpiar notificaciones"
                      className="text-text-muted hover:text-text cursor-pointer rounded p-1"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
                {pushSupported && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-text-secondary text-sm">Notificaciones del navegador</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pushState === "on"}
                      aria-label="Notificaciones del navegador"
                      disabled={pushChecking || pushState === "unknown" || (isPushSupported() && Notification.permission === "denied")}
                      onClick={() => void togglePush()}
                      className={`relative flex h-6 w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${pushState === "on" ? "bg-primary" : "bg-border"}`}
                    >
                      {pushState === "unknown" ? (
                        <LoaderCircle className="size-4 animate-spin text-white" aria-label="Verificando" />
                      ) : (
                        <span className={`bg-white absolute top-0.5 size-5 rounded-full shadow transition-transform ${pushState === "on" ? "translate-x-2.5" : "-translate-x-2.5"}`} />
                      )}
                    </button>
                  </div>
                )}
                {pushSupported && Notification.permission === "denied" && (
                  <p className="text-danger mt-2 text-xs">
                    Bloqueaste las notificaciones. Habilítalas en la configuración del navegador.{" "}
                    <a href="https://support.google.com/chrome/answer/3220216" target="_blank" rel="noreferrer" className="underline">¿Cómo activarlas?</a>
                  </p>
                )}
                {pushError && <p role="alert" className="text-danger mt-2 text-xs">{pushError}</p>}
                {pushConfirmation && <p role="status" className={`text-success mt-2 text-xs transition-opacity duration-500 ${pushConfirmationFading ? "opacity-0" : "opacity-100"}`}>{pushConfirmation}</p>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && serverNotifications.length === 0 ? (
                  <p className="text-text-muted px-4 py-8 text-center text-sm">No tienes notificaciones nuevas.</p>
                ) : (
                  <>
                {serverNotifications.map((notification) => (
                  <button
                    type="button"
                    key={`server-${notification.id}`}
                    onClick={() => void openServerNotification(notification)}
                    className="border-border hover:bg-surface-elevated flex w-full cursor-pointer items-start gap-3 border-b px-4 py-3 text-left last:border-0"
                  >
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.read ? "bg-border" : "bg-primary"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="text-text block text-sm font-medium">{notification.title}</span>
                      <span className="text-text-secondary mt-0.5 block truncate text-sm">{notification.message}</span>
                    </span>
                    {notification.read && <Check className="text-text-muted size-4 shrink-0" aria-label="Leída" />}
                  </button>
                ))}
                {notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => openNotification(notification)}
                    className="border-border hover:bg-surface-elevated flex w-full cursor-pointer items-start gap-3 border-b px-4 py-3 text-left last:border-0"
                  >
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.read ? "bg-border" : "bg-primary"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="text-text block text-sm font-medium">Nuevo mensaje recibido</span>
                      <span className="text-text-secondary mt-0.5 block truncate text-sm">{notification.body}</span>
                    </span>
                    {notification.read && <Check className="text-text-muted size-4 shrink-0" aria-label="Leída" />}
                  </button>
                ))}
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
