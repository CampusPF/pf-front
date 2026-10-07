"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useChatCenter } from "@/components/chat/ChatCenterProvider";
import { onNewMessage } from "@/services/chat/chat.socket";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/services/notifications/notifications.service";
import {
  isPushEnabled,
  isPushSupported,
  registerPush,
  syncPushSubscription,
  unregisterPush,
} from "@/services/push/push.service";

/* Dueño único de las notificaciones, igual que ChatCenterProvider lo es del
   chat. Antes todo esto vivía dentro de DashboardTopbar, así que la campana
   existía sólo en /dashboard: desde la landing, el catálogo o el reproductor
   no había forma de ver un aviso ni —peor— de ACTIVAR las notificaciones del
   navegador, que es lo único que las hace funcionar.

   Vive en el root layout, debajo de ChatCenterProvider (lo consume para saber
   qué conversación está abierta y no notificar algo que ya estás mirando). */

/** Aviso de chat: no se persiste, sale del socket y vive en memoria. */
export interface ChatNotification {
  id: string;
  conversationId: string;
  body: string;
  read: boolean;
}

export type PushState = "on" | "off" | "unknown";

/** Constante: devolver `[]` nuevo en cada render invalidaría los memos. */
const EMPTY_NOTIFICATIONS: AppNotification[] = [];

/** ¿El usuario bloqueó las notificaciones a nivel navegador? */
function permissionDenied(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "denied";
}

/* Sólo para que el switch no parpadee mientras se verifica contra el
   navegador: la verdad es `isPushEnabled()`, no esto. Fuera del componente
   porque escribir en localStorage es un efecto y no tiene por qué recrearse. */
function rememberPushState(userId: string | undefined, state: PushState): void {
  if (!userId) return;
  try {
    localStorage.setItem(`push-enabled:${userId}`, state);
  } catch {
    // Modo privado o storage lleno: no es crítico.
  }
}

interface NotificationsCenterValue {
  /** Avisos del back (foros). Persistidos, con link. */
  serverNotifications: AppNotification[];
  /** Avisos de chat de esta sesión. */
  chatNotifications: ChatNotification[];
  unreadCount: number;
  openServerNotification: (notification: AppNotification) => Promise<void>;
  openChatNotification: (notification: ChatNotification) => void;
  clearAll: () => void;
  // Push del navegador
  pushSupported: boolean;
  pushBlocked: boolean;
  pushState: PushState;
  pushError: string | null;
  pushConfirmation: string | null;
  /** Recibe el estado actual del switch; ver el comentario en el provider. */
  togglePush: (current: PushState) => Promise<void>;
}

const NotificationsCenterContext = createContext<NotificationsCenterValue | null>(null);

export function useNotificationsCenter(): NotificationsCenterValue {
  const value = useContext(NotificationsCenterContext);
  if (!value) {
    throw new Error("useNotificationsCenter debe usarse dentro de NotificationsCenterProvider");
  }
  return value;
}

export default function NotificationsCenterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { enabled: chatEnabled, selectedId, isPanelOpen, openConversation } = useChatCenter();

  const [storedNotifications, setServerNotifications] = useState<AppNotification[]>([]);
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);
  /* Al cerrar sesión no se limpia el estado: se deja de exponer. Así no hace
     falta un setState síncrono dentro del efecto de carga. Va memoizado para
     no devolver un array nuevo en cada render (rompería el useMemo del value). */
  const serverNotifications = useMemo(
    () => (user?.id ? storedNotifications : EMPTY_NOTIFICATIONS),
    [user?.id, storedNotifications],
  );
  const [pushSupported, setPushSupported] = useState(false);
  const [pushBlocked, setPushBlocked] = useState(false);
  const [pushState, setPushState] = useState<PushState>("unknown");
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushConfirmation, setPushConfirmation] = useState<string | null>(null);

  const unreadCount =
    chatNotifications.filter((n) => !n.read).length +
    serverNotifications.filter((n) => !n.read).length;

  /* Estado del push + RE-SINCRONIZACIÓN.
     El `syncPushSubscription` de acá es lo que arregla el desfasaje silencioso
     de producción: el back borra la fila cuando el servicio de push responde
     410 (endpoint rotado) o 403 (cambiaron las claves VAPID), pero el
     navegador conserva su suscripción local y el switch sigue diciendo "on".
     Al entrar a la app la volvemos a registrar, que es idempotente. */
  useEffect(() => {
    const supported = isPushSupported();
    const storageKey = `push-enabled:${user?.id ?? ""}`;
    let active = true;

    const persist = (state: PushState) => rememberPushState(user?.id, state);

    /* Todo el estado se setea acá adentro y no en el cuerpo del efecto: un
       setState síncrono en un effect encadena renders (regla del React
       Compiler), y además esto depende de APIs del navegador que igual hay
       que consultar de forma asincrónica. */
    const verify = async () => {
      setPushSupported(supported);

      if (!user?.id || !supported) {
        setPushState("off");
        setPushBlocked(false);
        return;
      }

      try {
        const cached = localStorage.getItem(storageKey);
        if (cached === "on" || cached === "off") setPushState(cached);
      } catch {
        // Storage bloqueado: se resuelve igual con el chequeo real de abajo.
      }

      if (permissionDenied()) {
        if (!active) return;
        setPushBlocked(true);
        setPushState("off");
        persist("off");
        return;
      }
      setPushBlocked(false);

      const enabled = await isPushEnabled();
      if (!active) return;
      setPushState(enabled ? "on" : "off");
      persist(enabled ? "on" : "off");

      if (enabled) await syncPushSubscription();
    };

    void verify();

    function syncFromOtherTab(event: StorageEvent) {
      if (event.key === storageKey) void verify();
    }
    function verifyWhenVisible() {
      if (document.visibilityState === "visible") void verify();
    }
    window.addEventListener("storage", syncFromOtherTab);
    document.addEventListener("visibilitychange", verifyWhenVisible);
    return () => {
      active = false;
      window.removeEventListener("storage", syncFromOtherTab);
      document.removeEventListener("visibilitychange", verifyWhenVisible);
    };
  }, [user?.id]);

  // El cartel de confirmación se borra solo.
  useEffect(() => {
    if (!pushConfirmation) return;
    const id = window.setTimeout(() => setPushConfirmation(null), 3_000);
    return () => window.clearTimeout(id);
  }, [pushConfirmation]);

  /* Avisos del back (foros): al montar y cada minuto. Si falla, la campana
     sigue mostrando los del chat. Sin sesión no se pide nada y lo que haya
     quedado en memoria se descarta al exponerlo (ver `value`), para no setear
     estado de forma síncrona dentro del efecto. */
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
  }, [user?.id]);

  /* Mensajes de chat en vivo. Sólo con el chat habilitado: suscribirse sin él
     abriría un socket propio. No se notifica la conversación que está abierta. */
  useEffect(
    () =>
      chatEnabled
        ? onNewMessage((payload) => {
            if (!payload || typeof payload !== "object") return;
            const message = payload as Record<string, unknown>;
            if (
              typeof message.id !== "string" ||
              typeof message.senderId !== "string" ||
              typeof message.receiverId !== "string" ||
              typeof message.content !== "string" ||
              message.receiverId !== user?.id
            ) {
              return;
            }

            const conversationId = `direct-${message.senderId}`;
            if (selectedId === conversationId && isPanelOpen) return;

            setChatNotifications((current) =>
              [
                {
                  id: message.id as string,
                  conversationId,
                  body: message.content as string,
                  read: false,
                },
                ...current.filter((n) => n.id !== message.id),
              ].slice(0, 20),
            );
          })
        : undefined,
    [chatEnabled, user?.id, selectedId, isPanelOpen],
  );

  const openServerNotification = useCallback(async (notification: AppNotification) => {
    setServerNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    );
    if (!notification.read) {
      await markNotificationRead(notification.id).catch(() => undefined);
    }
  }, []);

  const openChatNotification = useCallback(
    (notification: ChatNotification) => {
      setChatNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
      openConversation(notification.conversationId);
    },
    [openConversation],
  );

  const clearAll = useCallback(() => {
    setChatNotifications([]);
    setServerNotifications((current) => current.map((item) => ({ ...item, read: true })));
    void markAllNotificationsRead().catch(() => undefined);
  }, []);

  /* El estado actual llega por parámetro en vez de leerse de acá adentro: así
     `togglePush` no depende de `pushState` y no se recrea (ni invalida el
     value del contexto) cada vez que el switch cambia. Quien lo llama ya lo
     tiene a mano. */
  async function togglePush(current: PushState) {
    const previous = current;
    setPushState("unknown");
    setPushError(null);
    setPushConfirmation(null);
    try {
      if (previous === "on") {
        await unregisterPush();
        setPushState("off");
        setPushConfirmation("Notificaciones desactivadas");
        rememberPushState(user?.id, "off");
      } else {
        const enabled = await registerPush();
        setPushState(enabled ? "on" : "off");
        setPushConfirmation(enabled ? "Notificaciones activadas" : null);
        if (!enabled && permissionDenied()) setPushBlocked(true);
        rememberPushState(user?.id, enabled ? "on" : "off");
      }
    } catch (error) {
      setPushError(
        error instanceof Error ? error.message : "No pudimos actualizar las notificaciones.",
      );
      setPushState(previous);
    }
  }

  /* Sin useMemo manual a propósito: este proyecto compila con el React
     Compiler, que memoiza el objeto solo. Envolverlo a mano obligaba a listar
     `togglePush` como dependencia, y como esa función toca APIs del navegador
     el compilador no podía preservar la memoización (el mismo aviso que
     arrastra AuthProvider). Dejándoselo a él, queda memoizado de verdad. */
  const value = {
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
  };

  return (
    <NotificationsCenterContext.Provider value={value}>
      {children}
    </NotificationsCenterContext.Provider>
  );
}
