/* Formas CRUDAS que devuelve el back en los endpoints del dashboard, tal cual
   hoy (no el contrato ideal). La normalización a lo que consumen los
   componentes vive en dashboard.view.ts. */

export type CourseDifficulty = "beginner" | "intermediate" | "advanced";

/** Item de `GET /course-enrollments/me` (relations: { course: true }). */
export interface RawEnrollment {
  id: string;
  progressPercent: number;
  isActive: boolean;
  completedAt: string | null;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    difficulty: CourseDifficulty;
    imageUrl: string | null;
  };
}

/** Item de `GET /lesson-progress/me` (relations: { lesson, enrollment: { course } }). */
export interface RawLessonProgress {
  id: string;
  completed: boolean;
  completedAt: string | null;
  lesson: { id: string; title: string; order: number };
  enrollment: {
    id: string;
    course: { id: string; slug: string; title: string };
  };
}

/** Item de `GET /subscriptions/me`. Definido en su propio módulo de servicio. */
export type { Subscription as RawSubscription } from "@/services/subscriptions/subscriptions.service";

/** `GET /ai-tutor/usage/me` — disponible, hoy no se muestra en el dashboard. */
export interface RawAiTutorUsage {
  messagesUsedToday: number;
  dailyLimit: number | null;
  remaining: number | null;
}
