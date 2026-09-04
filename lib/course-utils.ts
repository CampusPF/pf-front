import type { Course, Lesson, Module } from "@/types/course.types";

/* Helpers puros sobre la data de cursos. Todo devuelve copias: `MOCK_COURSES` es
   un módulo compartido entre requests del server, ordenarlo in-place lo mutaría
   para todos. */

function sortedModules(course: Course): Module[] {
  return [...course.modules].sort((a, b) => a.order - b.order);
}

function sortedLessons(courseModule: Module): Lesson[] {
  return [...courseModule.lessons].sort((a, b) => a.order - b.order);
}

/** Aplana el curso a una sola lista de lecciones, en el orden en que se cursan. */
export function getAllLessons(course: Course): Lesson[] {
  return sortedModules(course).flatMap(sortedLessons);
}

export function getAdjacentLessons(course: Course, currentLessonId: string) {
  const all = getAllLessons(course);
  const idx = all.findIndex((l) => l.id === currentLessonId);

  return {
    previous: idx > 0 ? all[idx - 1] : null,
    next: idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null,
  };
}

export function findLesson(course: Course, lessonId: string): Lesson | null {
  return getAllLessons(course).find((l) => l.id === lessonId) ?? null;
}

export function findModuleOfLesson(
  course: Course,
  lessonId: string,
): Module | null {
  return (
    course.modules.find((m) => m.lessons.some((l) => l.id === lessonId)) ?? null
  );
}

/** Posición 1-based de la lección dentro del curso, para el "Lección 3 de 14". */
export function getLessonPosition(course: Course, lessonId: string) {
  const all = getAllLessons(course);
  const idx = all.findIndex((l) => l.id === lessonId);

  return { index: idx + 1, total: all.length };
}

export function getFirstLesson(course: Course): Lesson | null {
  return getAllLessons(course)[0] ?? null;
}

/** Primera lección sin completar: la que abre el botón "Continuar donde dejaste". */
export function getResumeLesson(
  course: Course,
  completedLessonIds: readonly string[],
): Lesson | null {
  const all = getAllLessons(course);
  return all.find((l) => !completedLessonIds.includes(l.id)) ?? null;
}

export function getModuleMinutes(courseModule: Module): number {
  return courseModule.lessons.reduce((acc, l) => acc + l.durationMinutes, 0);
}

export function getLessonsCount(course: Course): number {
  return course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
}

/** 8 → "8 min" · 63 → "1h 3min" · 120 → "2h" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

/** 12400 → "12.4k" · 980 → "980" (mismo formato que usa la landing) */
export function formatStudents(count: number): string {
  if (count < 1000) return String(count);

  const thousands = (count / 1000).toFixed(1).replace(/\.0$/, "");
  return `${thousands}k`;
}

export function lessonHref(courseSlug: string, lessonId: string): string {
  return `/courses/${courseSlug}/learn/${lessonId}`;
}
