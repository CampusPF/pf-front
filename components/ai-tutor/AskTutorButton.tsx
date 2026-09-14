"use client";

import { Sparkles } from "lucide-react";

import { useAiTutor } from "@/components/ai-tutor/AiTutorProvider";

/* Acceso al tutor dentro del reproductor, en el header de la lección. Ahí
   reemplaza al botón flotante (AiTutorFAB se oculta en /learn/), que tapaba
   "Siguiente" y el botón de lecciones en mobile. */
export default function AskTutorButton() {
  const { isOpen, open } = useAiTutor();

  return (
    <button
      type="button"
      onClick={open}
      aria-expanded={isOpen}
      className="bg-primary/10 text-primary hover:bg-primary/20 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150"
    >
      <Sparkles className="size-4" aria-hidden />
      <span className="hidden sm:inline">Preguntarle al tutor</span>
      <span className="sm:hidden">Tutor</span>
    </button>
  );
}
