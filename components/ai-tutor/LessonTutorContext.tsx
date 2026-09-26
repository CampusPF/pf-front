"use client";

import { useEffect } from "react";

import { useAiTutor } from "@/components/ai-tutor/AiTutorProvider";

/* El reproductor de lecciones es un Server Component (necesita leer el
   curso/lección antes de renderizar), así que no puede llamar useAiTutor()
   directamente. Este puente client-only avisa "estoy en esta lección" al
   provider global mientras está montado, y lo limpia al salir. No renderiza
   nada.

   `lessonId` es lo que hace que el chat sea real: sin él el back no tiene
   contra qué crear la conversación (ver AiTutorProvider). LessonPlayer sólo
   lo monta cuando `canView` es true — la misma regla de acceso que tapa el
   contenido tapa también el tutor, para no discutir gratis una lección paga
   que el alumno no puede ver. */
export default function LessonTutorContext({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const { setLesson } = useAiTutor();

  useEffect(() => {
    setLesson({ id: lessonId, title: lessonTitle });
    return () => setLesson(null);
  }, [lessonId, lessonTitle, setLesson]);

  return null;
}
