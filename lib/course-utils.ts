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

/**
 * Título del módulo sin el "Módulo N:" que a veces ya trae el dato. La UI
 * antepone "Módulo {order} ·", así que "Módulo 1: Fundamentos" se veía como
 * "Módulo 1 · Módulo 1: Fundamentos". Si el título es sólo ese prefijo, se
 * deja tal cual para no mostrarlo vacío.
 */
export function displayModuleTitle(title: string): string {
  const stripped = title.replace(/^\s*m[oó]dulo\s*\d+\s*[:.\-–—·]?\s*/i, "");
  return stripped || title;
}

/** "1 lección" · "3 lecciones". */
export function lessonsLabel(count: number): string {
  return `${count} ${count === 1 ? "lección" : "lecciones"}`;
}

/** "1 módulo" · "3 módulos". */
export function modulesLabel(count: number): string {
  return `${count} ${count === 1 ? "módulo" : "módulos"}`;
}

export function getLessonsCount(course: Course): number {
  return course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
}

/** 45 → "45 min" · 90 → "1 h 30 min" · 120 → "2 h". Uno solo para todo el
    sitio: duración de lección, de módulo, de curso y horas estudiadas. */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
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

export function quizHref(courseSlug: string, quizId: string): string {
  return `/courses/${courseSlug}/learn/quiz/${quizId}`;
}
