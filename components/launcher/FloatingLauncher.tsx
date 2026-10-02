"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, MessageSquare, Sparkles, X } from "lucide-react";

import { useAiTutor } from "@/components/ai-tutor/AiTutorProvider";
import { CHATS_PAGE_PATH, useChatCenter } from "@/components/chat/ChatCenterProvider";

function formatBadge(count: number): string {
  return count > 9 ? "9+" : String(count);
}

/* Botón flotante global: reemplaza al que abría sólo el tutor IA. Con
   sesión abre un menú con "Mensajes" (chat en vivo, con los no leídos) y
   "Tutor IA"; sin sesión sigue abriendo el tutor directo, sin menú de por
   medio.

   El badge es real (no leídos del chat): el punto naranja decorativo que
   tenía el botón anterior se sacó, porque un aviso que nunca significa nada
   le enseña al usuario a ignorar el que sí.

   No aparece en el reproductor (el tutor está en el header, AskTutorButton)
   ni en /dashboard/chats (ya estás en los mensajes; además tapaba el
   composer en mobile). */
export default function FloatingLauncher() {
  const { isOpen: tutorOpen, open: openTutor } = useAiTutor();
  const { enabled: chatEnabled, totalUnread, openConversation, role } = useChatCenter();
  const pathname = usePathname();
  const [hiddenByScroll, setHiddenByScroll] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Mientras se baja la página el botón se esconde y vuelve al subir: en
     mobile quedaba fijo encima del precio y la flecha de las tarjetas y de
     las barras de progreso. Umbral de 8px para no parpadear con el rebote. */
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      setHiddenByScroll(y > lastY && y > 80);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menú: foco al primer ítem al abrir; ESC o click afuera lo cierran.
  useEffect(() => {
    if (!menuOpen) return;
    itemRefs.current[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- al navegar, el menú se cierra.
  useEffect(() => setMenuOpen(false), [pathname]);

  if (pathname.includes("/learn/") || pathname === CHATS_PAGE_PATH) return null;

  const hidden = hiddenByScroll && !menuOpen;

  function handleMenuKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const delta = event.key === "ArrowDown" ? 1 : -1;
    items[(index + delta + items.length) % items.length]?.focus();
  }

  function choose(action: () => void) {
    setMenuOpen(false);
    action();
  }

  const unreadLabel =
    totalUnread > 0
      ? `, ${totalUnread} ${totalUnread === 1 ? "mensaje sin leer" : "mensajes sin leer"}`
      : "";

  return (
    <div
      ref={rootRef}
      className={`fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 transition-all duration-200 sm:right-6 sm:bottom-6 ${
        hidden ? "pointer-events-none translate-y-24 opacity-0" : ""
      }`}
    >
      {chatEnabled && menuOpen && (
        <div
          role="menu"
          aria-label="Ayuda y mensajes"
          onKeyDown={handleMenuKeyDown}
          className="chat-toast-in bg-surface-elevated border-border w-72 origin-bottom-right overflow-hidden rounded-2xl border p-1.5 shadow-2xl"
        >
          <LauncherItem
            ref={(el) => {
              itemRefs.current[0] = el;
            }}
            icon={<MessageCircle className="size-5" aria-hidden />}
            title="Mensajes"
            description={
              role === "admin"
                ? "Escribile a los docentes"
                : role === "teacher"
                  ? "Chateá con tus alumnos y la administración"
                  : "Escribile a tus docentes"
            }
            badge={totalUnread}
            onClick={() => choose(() => openConversation())}
          />
          <LauncherItem
            ref={(el) => {
              itemRefs.current[1] = el;
            }}
            icon={<Sparkles className="size-5" aria-hidden />}
            title="Tutor IA"
            description="Resolvé dudas de una lección"
            onClick={() => choose(openTutor)}
          />
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={chatEnabled ? () => setMenuOpen((prev) => !prev) : openTutor}
        aria-label={chatEnabled ? `Mensajes y tutor IA${unreadLabel}` : "Abrir tutor IA"}
        aria-haspopup={chatEnabled ? "menu" : undefined}
        aria-expanded={chatEnabled ? menuOpen : tutorOpen}
        className="bg-primary-solid hover:bg-primary-solid-hover relative flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-2xl transition-transform duration-200 hover:scale-105 sm:size-14"
      >
        {menuOpen ? (
          <X className="size-5 sm:size-6" aria-hidden />
        ) : (
          <MessageSquare className="size-5 sm:size-6" aria-hidden />
        )}
        {chatEnabled && totalUnread > 0 && !menuOpen && (
          <span
            aria-hidden
            className="bg-accent-solid border-bg absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 px-1 text-[11px] leading-none font-bold text-white"
          >
            {formatBadge(totalUnread)}
          </span>
        )}
      </button>
    </div>
  );
}

function LauncherItem({
  ref,
  icon,
  title,
  description,
  badge = 0,
  onClick,
}: {
  ref: React.Ref<HTMLButtonElement>;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      onClick={onClick}
      className="hover:bg-surface focus-visible:bg-surface flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none"
    >
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-text block text-sm font-semibold">{title}</span>
        <span className="text-text-muted block truncate text-xs">{description}</span>
      </span>
      {badge > 0 && (
        <span className="bg-accent-solid flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white">
          {formatBadge(badge)}
          <span className="sr-only"> sin leer</span>
        </span>
      )}
    </button>
  );
}
