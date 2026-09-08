"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/* TODO(campus): el brief pedía un store de Zustand (`lib/ai-tutor-store.ts`),
   pero `zustand` no está instalado. Este contexto expone la misma API
   —isOpen / open / close / toggle— así que migrar es cambiar el import de
   `useAiTutor` y borrar el provider.

   Vive en el root layout (ver app/layout.tsx): el FAB y el drawer son
   globales, no sólo del reproductor de lecciones. `lessonTitle` es lo único
   que varía según dónde estés — una lección lo setea (ver
   LessonTutorContext.tsx) para personalizar el saludo del tutor; en
   cualquier otra pantalla queda en null y el tutor saluda genérico. */

interface AiTutorValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  lessonTitle: string | null;
  setLessonTitle: (title: string | null) => void;
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
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, lessonTitle, setLessonTitle }),
    [isOpen, open, close, toggle, lessonTitle],
  );

  return (
    <AiTutorContext.Provider value={value}>{children}</AiTutorContext.Provider>
  );
}
