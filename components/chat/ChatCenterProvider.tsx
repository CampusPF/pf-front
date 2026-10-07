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
import { getChatSocket, onTypingUpdate } from "@/services/chat/chat.socket";
import {
  chatRoleFor,
  directConversationId,
  getMyConversations,
  markConversationRead,
  subscribeToMessages,
} from "@/services/chat/chat.service";
import type { ChatConversation, ChatRole } from "@/types/chat.types";

const LIST_POLL_MS = 30_000;

export const CHATS_PAGE_PATH = "/dashboard/chats";

export interface ChatToastData {
  id: string;
  conversationId: string;
  title: string;
  avatarUrl: string | null;
  text: string;
}

interface ChatCenterValue {
  enabled: boolean;
  role: ChatRole | null;
  conversations: ChatConversation[] | null;
  error: string | null;
  totalUnread: number;
  selectedId: string | null;
  selectConversation: (conversationId: string | null) => void;
  openConversation: (conversationId?: string) => void;
  isPanelOpen: boolean;
  closePanel: () => void;
  toast: ChatToastData | null;
  dismissToast: () => void;
  typingConversations: Set<string>;
  isTyping: (conversationId: string) => boolean;
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
  const [typingConversations, setTypingConversations] = useState<Set<string>>(new Set());
  const typingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const clearTypingTimer = useCallback((conversationId: string) => {
    const timer = typingTimersRef.current.get(conversationId);
    if (!timer) return;
    clearTimeout(timer);
    typingTimersRef.current.delete(conversationId);
  }, []);

  const scheduleTypingExpiry = useCallback((conversationId: string) => {
    clearTypingTimer(conversationId);
    const timer = setTimeout(() => {
      setTypingConversations((prev) => {
        if (!prev.has(conversationId)) return prev;
        const next = new Set(prev);
        next.delete(conversationId);
        return next;
      });
      typingTimersRef.current.delete(conversationId);
    }, 6000);
    typingTimersRef.current.set(conversationId, timer);
  }, [clearTypingTimer]);

  const onChatsPage = pathname === CHATS_PAGE_PATH;
  const viewingId = isPanelOpen || onChatsPage ? selectedId : null;
  const viewingIdRef = useRef(viewingId);
  useEffect(() => {
    viewingIdRef.current = viewingId;
  }, [viewingId]);

  const reload = useCallback(async (): Promise<ChatConversation[] | null> => {
    if (!user || !role) return null;
    try {
      const data = await getMyConversations(user, role);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset al cambiar la sesión.
    setConversations(null);
    setSelectedId(null);
    setIsPanelOpen(false);
    setToast(null);
    setError(null);
    setTypingConversations(new Set());
    typingTimersRef.current.forEach((timer) => clearTimeout(timer));
    typingTimersRef.current.clear();
  }, [user?.id]);

  useEffect(() => {
    const timers = typingTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !user) return;
    void reload();
    const interval = setInterval(reload, LIST_POLL_MS);
    const myId = user.id;

    const unsubscribe = subscribeToMessages(async (raw) => {
      const fresh = await reload();
      if (raw.senderId === myId) return;

      const conversationId = directConversationId(raw.senderId);
      setTypingConversations((prev) => {
        if (!prev.has(conversationId)) return prev;
        const next = new Set(prev);
        next.delete(conversationId);
        return next;
      });
      clearTypingTimer(conversationId);

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
  }, [clearTypingTimer, enabled, user, reload]);

  useEffect(() => {
    if (!enabled || !user) return;

    const timers = typingTimersRef.current;

    const unsubscribe = onTypingUpdate(({ senderId, isTyping }) => {
      if (senderId === user.id) return;

      const conversationId = directConversationId(senderId);

      setTypingConversations((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(conversationId);
        else next.delete(conversationId);
        return next;
      });

      if (isTyping) scheduleTypingExpiry(conversationId);
      else clearTypingTimer(conversationId);
    });

    return () => {
      unsubscribe();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [clearTypingTimer, enabled, scheduleTypingExpiry, user]);

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
  const isTyping = useCallback(
    (conversationId: string) => typingConversations.has(conversationId),
    [typingConversations],
  );

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- abrir el link ?conversation=... es un efecto de navegación, no un render.
    selectConversation(requestedId);
    window.history.replaceState(window.history.state, "", pathname);
  }, [pathname, conversations, selectConversation]);

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
      typingConversations,
      isTyping,
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
      typingConversations,
      isTyping,
    ],
  );

  return <ChatCenterContext.Provider value={value}>{children}</ChatCenterContext.Provider>;
}
