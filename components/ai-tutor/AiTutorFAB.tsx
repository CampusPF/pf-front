"use client";

import { MessageSquare } from "lucide-react";

import { useAiTutor } from "@/components/ai-tutor/AiTutorProvider";

/** Botón flotante del tutor. Sólo se monta adentro del lesson player. */
export default function AiTutorFAB() {
  const { isOpen, open } = useAiTutor();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Abrir tutor IA"
      aria-expanded={isOpen}
      className="bg-primary-solid hover:bg-primary-solid-hover fixed right-6 bottom-6 z-40 flex size-14 cursor-pointer items-center justify-center rounded-full text-white shadow-2xl transition-all duration-200 hover:scale-110"
    >
      <MessageSquare className="size-6" aria-hidden />
      {/* Dot de "tengo algo para contarte" — decorativo por ahora. */}
      <span className="bg-accent border-primary absolute top-1 right-1 size-3 rounded-full border-2" />
    </button>
  );
}
