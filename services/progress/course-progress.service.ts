import { apiFetch } from "@/services/api-client";
import { USE_MOCK_COURSES } from "@/services/courses/courses.source";
import {
  getMyEnrollments,
  getMyLessonProgress,
} from "@/services/dashboard/dashboard.service";
import type { RawLessonProgress } from "@/services/dashboard/dashboard.types";
import { MOCK_COMPLETED_LESSON_IDS, MOCK_PROGRESS_PERCENT } from "@/data/progress.mock";

/* Progreso del usuario en UN curso: inscripción + lecciones completadas.
   Todo con sesión.

   `progressPercent` lo calcula el back (se recalcula en cada POST/PATCH a
   /lesson-progress): acá sólo se lee. Para moverlo, se completan lecciones. */

export interface CourseProgress {
  /** `null` = no está inscripto (o la inscripción está inactiva). */
  enrollmentId: string | null;
  progressPercent: number;
  completedLessonIds: string[];
  /** lessonId → id del registro de progreso, para hacer PATCH en vez de POST. */
  recordByLesson: Record<string, string>;
}

const EMPTY: CourseProgress = {
  enrollmentId: null,
  progressPercent: 0,
  completedLessonIds: [],
  recordByLesson: {},
};

/* TODO(back): no hay `GET /course-enrollments/me?courseId=`. Pedimos todas
   las inscripciones y todo el progreso y filtramos. Son listas chicas por
   usuario, así que alcanza. */
export async function getCourseProgress(courseId: string): Promise<CourseProgress> {
  if (USE_MOCK_COURSES) {
    return {
      ...EMPTY,
      enrollmentId: "mock",
      progressPercent: MOCK_PROGRESS_PERCENT,
      completedLessonIds: [...MOCK_COMPLETED_LESSON_IDS],
    };
  }

  const [enrollments, progress] = await Promise.all([
    getMyEnrollments(),
    getMyLessonProgress().catch(() => [] as RawLessonProgress[]),
  ]);

  const enrollment = enrollments.find((e) => e.course?.id === courseId && e.isActive);
  if (!enrollment) return EMPTY;

  const mine = progress.filter((record) => record.enrollment?.id === enrollment.id);

  return {
    enrollmentId: enrollment.id,
    progressPercent: Math.round(enrollment.progressPercent ?? 0),
    completedLessonIds: mine.filter((r) => r.completed).map((r) => r.lesson.id),
    recordByLesson: Object.fromEntries(mine.map((r) => [r.lesson.id, r.id])),
  };
}

/** Marca (o desmarca) una lección. Usa PATCH si ya había registro, POST si no. */
export async function setLessonCompleted(
  progress: CourseProgress,
  lessonId: string,
  completed: boolean,
): Promise<void> {
  if (USE_MOCK_COURSES) return;
  if (!progress.enrollmentId) throw new Error("No estás inscripto en este curso.");

  const recordId = progress.recordByLesson[lessonId];

  if (recordId) {
    await apiFetch(`/lesson-progress/${recordId}`, {
      method: "PATCH",
      body: { completed },
      auth: true,
    });
    return;
  }

  await apiFetch("/lesson-progress", {
    method: "POST",
    body: { enrollmentId: progress.enrollmentId, lessonId, completed },
    auth: true,
  });
}

/**
 * `POST /course-enrollments` — sólo cursos GRATIS. Un curso pago responde
 * 402: esos se compran por checkout y la inscripción la crea el back.
 */
export async function enrollInFreeCourse(courseId: string): Promise<void> {
  await apiFetch("/course-enrollments", {
    method: "POST",
    body: { courseId },
    auth: true,
  });
}
