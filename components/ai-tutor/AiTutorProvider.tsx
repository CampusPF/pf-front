"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/* TODO(campus): el brief pedía un store de Zustand (`lib/ai-tutor-store.ts`),
   pero `zustand` no está instalado. Este contexto expone la misma API
   —isOpen / open / close / toggle— así que migrar es cambiar el import de
   `useAiTutor` y borrar el provider.

   Vive en el root layout (ver app/layout.tsx): el FAB y el drawer son
   globales, no sólo del reproductor de lecciones. `lessonId`/`lessonTitle`
   son lo único que varía según dónde estés — una lección los setea (ver
   LessonTutorContext.tsx); en cualquier otra pantalla quedan en null.

   `lessonId` no es cosmético: el back exige una lección real para crear la
   conversación (`POST /ai-tutor/conversations`, ver ai-tutor.service.ts) —
   no existe un chat general. Sin él, el drawer muestra un estado "abrí una
   lección para usar el tutor" en vez de un composer que fallaría al enviar. */

interface AiTutorValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  lessonId: string | null;
  lessonTitle: string | null;
  setLesson: (lesson: { id: string; title: string } | null) => void;
  coursePage: { slug: string; title: string; lesson: { id: string; title: string } | null; enrolled: boolean; loading: boolean } | null;
  setCoursePage: (course: AiTutorValue["coursePage"]) => void;
}

const AiTutorContext = createContext<AiTutorValue | null>(null);

export function useAiTutor(): AiTutorValue {
  const value = useContext(AiTutorContext);

  if (!value) {
    throw new Error("useAiTutor tiene que usarse adentro de <AiTutorProvider>");
  }

  return value;
}

export default function AiTutorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lesson, setLessonState] = useState<{ id: string; title: string } | null>(null);
  const [coursePage, setCoursePageState] = useState<AiTutorValue["coursePage"]>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const setLesson = useCallback((next: { id: string; title: string } | null) => setLessonState(next), []);
  const setCoursePage = useCallback((next: AiTutorValue["coursePage"]) => setCoursePageState(next), []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      lessonId: lesson?.id ?? null,
      lessonTitle: lesson?.title ?? null,
      setLesson,
      coursePage,
      setCoursePage,
    }),
    [isOpen, open, close, toggle, lesson, setLesson, coursePage, setCoursePage],
  );

  return (
    <AiTutorContext.Provider value={value}>{children}</AiTutorContext.Provider>
  );
}
