"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { useAiTutor } from "@/components/ai-tutor/AiTutorProvider";

/** Botón flotante del tutor, en todas las pantallas salvo el reproductor. */
export default function AiTutorFAB() {
  const { isOpen, open } = useAiTutor();
  const pathname = usePathname();
  const [hiddenByScroll, setHiddenByScroll] = useState(false);

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

  // En el reproductor el tutor se abre desde el header (AskTutorButton).
  if (pathname.includes("/learn/")) return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Abrir tutor IA"
      aria-expanded={isOpen}
      className={`bg-primary-solid hover:bg-primary-solid-hover fixed right-4 bottom-4 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-2xl transition-all duration-200 hover:scale-110 sm:right-6 sm:bottom-6 sm:size-14 ${
        hiddenByScroll ? "pointer-events-none translate-y-24 opacity-0" : ""
      }`}
    >
      <MessageSquare className="size-5 sm:size-6" aria-hidden />
      {/* Dot de "tengo algo para contarte" — decorativo por ahora. */}
      <span className="bg-accent border-primary absolute top-0.5 right-0.5 size-3 rounded-full border-2 sm:top-1 sm:right-1" />
    </button>
  );
}
