"use client";

import { useEffect } from "react";

import { useAiTutor } from "@/components/ai-tutor/AiTutorProvider";

/* El reproductor de lecciones es un Server Component (necesita leer el
   curso/lección antes de renderizar), así que no puede llamar useAiTutor()
   directamente. Este puente client-only avisa "estoy en esta lección" al
   provider global mientras está montado, y lo limpia al salir — así el
   tutor personaliza el saludo en la lección y vuelve a genérico en
   cualquier otra pantalla. No renderiza nada. */
export default function LessonTutorContext({ lessonTitle }: { lessonTitle: string }) {
  const { setLessonTitle } = useAiTutor();

  useEffect(() => {
    setLessonTitle(lessonTitle);
    return () => setLessonTitle(null);
  }, [lessonTitle, setLessonTitle]);

  return null;
}
