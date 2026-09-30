"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { getChatSocket } from "@/services/chat/chat.socket";
import {
  chatRoleFor,
  directConversationId,
  getMyConversations,
  markConversationRead,
  subscribeToMessages,
} from "@/services/chat/chat.service";
import type { ChatConversation, ChatRole } from "@/types/chat.types";

/* Estado global del chat en vivo: conversaciones, no leídos, cuál está
   abierta y el panel lateral. Vive en el root layout (como el tutor IA) para
   que el aviso de un mensaje nuevo llegue esté donde esté el usuario.

   Es el ÚNICO que carga la lista y escucha el socket: la página
   /dashboard/chats, el panel, el badge del launcher, el toast y el título de
   la pestaña leen de acá, así nunca se contradicen (antes ChatsView tenía su
   propio polling y el resto de la app no se enteraba de nada). */

/* Respaldo por si el socket se cae: con el socket vivo, la lista se refresca
   al toque con cada `message:new`. */
const LIST_POLL_MS = 30_000;

export const CHATS_PAGE_PATH = "/dashboard/chats";

export interface ChatToastData {
  /** Cambia con cada mensaje: sirve de `key` para reiniciar el auto-cierre. */
  id: string;
  conversationId: string;
  title: string;
  avatarUrl: string | null;
  text: string;
}

interface ChatCenterValue {
  /** `false` sin sesión o para el admin (no participa del chat). */
  enabled: boolean;
  role: ChatRole | null;
  conversations: ChatConversation[] | null;
  error: string | null;
  totalUnread: number;
  selectedId: string | null;
  selectConversation: (conversationId: string | null) => void;
  /** Abre esa conversación: en la página de chats si ya estás ahí, si no en el panel. */
  openConversation: (conversationId?: string) => void;
  isPanelOpen: boolean;
  closePanel: () => void;
  toast: ChatToastData | null;
  dismissToast: () => void;
}

const ChatCenterContext = createContext<ChatCenterValue | null>(null);

export function useChatCenter(): ChatCenterValue {
  const value = useContext(ChatCenterContext);
  if (!value) {
    throw new Error("useChatCenter tiene que usarse adentro de <ChatCenterProvider>");
  }
  return value;
}

const TITLE_BADGE = /^\(\d+\+?\)\s/;

export default function ChatCenterProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const role = chatRoleFor(user?.role);
  const enabled = Boolean(user && role);

  const [conversations, setConversations] = useState<ChatConversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [toast, setToast] = useState<ChatToastData | null>(null);

  const onChatsPage = pathname === CHATS_PAGE_PATH;
  // La conversación que el usuario tiene a la vista ahora mismo (no basta
  // con que esté seleccionada: puede haber cerrado el panel).
  const viewingId = isPanelOpen || onChatsPage ? selectedId : null;
  const viewingIdRef = useRef(viewingId);
  useEffect(() => {
    viewingIdRef.current = viewingId;
  }, [viewingId]);

  const reload = useCallback(async (): Promise<ChatConversation[] | null> => {
    if (!user || !role) return null;
    try {
      const data = await getMyConversations(user, role);
      // La que está abierta se lee en el momento (ChatThread la marca como
      // leída): que el refresco no le vuelva a poner la insignia por una
      // carrera con el PATCH de "leído".
      const current = viewingIdRef.current;
      const next = current
        ? data.map((c) => (c.id === current ? { ...c, unreadCount: 0 } : c))
        : data;
      setConversations(next);
      setError(null);
      return next;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar tus conversaciones.");
      return null;
    }
  }, [user, role]);

  // Al cambiar de usuario (logout/login) no queda nada del anterior.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset al cambiar la sesión.
    setConversations(null);
    setSelectedId(null);
    setIsPanelOpen(false);
    setToast(null);
    setError(null);
  }, [user?.id]);

  useEffect(() => {
    if (!enabled || !user) return;
    void reload();
    const interval = setInterval(reload, LIST_POLL_MS);
    const myId = user.id;

    const unsubscribe = subscribeToMessages(async (raw) => {
      const fresh = await reload();
      if (raw.senderId === myId) return;

      const conversationId = directConversationId(raw.senderId);
      if (conversationId === viewingIdRef.current) return;

      const conversation = fresh?.find((c) => c.id === conversationId);
      setToast({
        id: raw.id,
        conversationId,
        title: conversation?.title ?? "Nuevo mensaje",
        avatarUrl: conversation?.avatarUrl ?? null,
        text: raw.content,
      });
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [enabled, user, reload]);

  // Abrir una conversación la saca de "sin leer" en todos lados a la vez.
  useEffect(() => {
    if (!viewingId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el badge con lo que se está viendo.
    setConversations((prev) =>
      prev?.some((c) => c.id === viewingId && c.unreadCount > 0)
        ? prev.map((c) => (c.id === viewingId ? { ...c, unreadCount: 0 } : c))
        : prev,
    );
    setToast((prev) => (prev?.conversationId === viewingId ? null : prev));
  }, [viewingId, conversations]);

  const totalUnread = useMemo(
    () => (conversations ?? []).reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations],
  );

  // "(3) Campus": se ve aunque la pestaña esté en segundo plano. Next
  // reescribe el <title> en cada navegación, así que se vuelve a aplicar
  // cada vez que cambia (el observer ignora el cambio que hace él mismo).
  useEffect(() => {
    const badge = totalUnread > 0 ? `(${totalUnread > 99 ? "99+" : totalUnread}) ` : "";

    function apply() {
      const base = document.title.replace(TITLE_BADGE, "");
      const next = `${badge}${base}`;
      if (document.title !== next) document.title = next;
    }

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      document.title = document.title.replace(TITLE_BADGE, "");
    };
  }, [totalUnread]);

  const selectConversation = useCallback(
    (conversationId: string | null) => {
      setSelectedId(conversationId);
      if (conversationId) markConversationRead(conversationId);
    },
    [],
  );

  const openConversation = useCallback(
    (conversationId?: string) => {
      if (conversationId) selectConversation(conversationId);
      if (!onChatsPage) setIsPanelOpen(true);
      setToast(null);
    },
    [onChatsPage, selectConversation],
  );

  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!enabled) return;
    const socket = getChatSocket();
    if (!socket) return;
    const otherUserId = viewingId?.startsWith("direct-")
      ? viewingId.slice("direct-".length)
      : null;
    if (otherUserId) socket.emit("chat:focus", { otherUserId });
    else socket.emit("chat:blur");
    return () => {
      socket.emit("chat:blur");
    };
  }, [enabled, viewingId, user?.id]);

  useEffect(() => {
    if (pathname !== CHATS_PAGE_PATH || !conversations) return;
    const requestedId = new URLSearchParams(window.location.search).get("conversation");
    if (!requestedId || !conversations.some((conversation) => conversation.id === requestedId)) return;
    selectConversation(requestedId);
    window.history.replaceState(window.history.state, "", pathname);
  }, [pathname, conversations, selectConversation]);

  // Si se navega a la página de chats con el panel abierto, la página toma
  // la posta (misma selección) y el panel sobra.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el panel no convive con la página de chats.
    if (onChatsPage) setIsPanelOpen(false);
  }, [onChatsPage]);

  const value = useMemo<ChatCenterValue>(
    () => ({
      enabled,
      role,
      conversations,
      error,
      totalUnread,
      selectedId,
      selectConversation,
      openConversation,
      isPanelOpen,
      closePanel,
      toast,
      dismissToast,
    }),
    [
      enabled,
      role,
      conversations,
      error,
      totalUnread,
      selectedId,
      selectConversation,
      openConversation,
      isPanelOpen,
      closePanel,
      toast,
      dismissToast,
    ],
  );

  return <ChatCenterContext.Provider value={value}>{children}</ChatCenterContext.Provider>;
}
