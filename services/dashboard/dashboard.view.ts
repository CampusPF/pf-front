import { gradientFor } from "@/services/courses/courses.adapter";
import { isSubscriptionCurrentlyActive } from "@/services/subscriptions/subscriptions.service";
import type {
  CourseDifficulty,
  RawEnrollment,
  RawLessonProgress,
  RawSubscription,
} from "@/services/dashboard/dashboard.types";

/* Toma las respuestas crudas del back y arma exactamente lo que necesitan los
   componentes del dashboard. Todo lo que NO se puede traer del back todavía
   queda marcado abajo con "MOCK" o "NO DISPONIBLE". */

export interface DashboardActiveCourse {
  /** id de la inscripción (course-enrollment), no del curso. */
  id: string;
  courseId: string;
  title: string;
  slug: string;
  /** REAL: course.description (puede venir vacía). */
  description: string;
  /** DERIVADO de course.difficulty — el back no manda categoría en /me. */
  categoryLabel: string;
  /** REAL: portada de Cloudinary. `null` si el curso no tiene. */
  imageUrl: string | null;
  /** DERIVADO del id: gradiente de respaldo cuando no hay portada. */
  coverGradient: string;
  /** REAL: enrollment.progressPercent. */
  progressPercent: number;
  /** REAL: contado de lesson-progress completadas de esta inscripción. */
  completedLessons: number;
  /** NO DISPONIBLE en GET /course-enrollments/me → null (no se muestra "X/Y"). */
  totalLessons: number | null;
  /** REAL: enrollment.completedAt — lo setea el back al llegar al 100%. */
  isCompleted: boolean;
  /** REAL: ISO de la inscripción. */
  enrolledAt: string;
  href: string;
}

export interface DashboardContinue {
  /** REAL. */
  courseTitle: string;
  /** REAL. */
  progressPercent: number;
  /** REAL. */
  href: string;
  /** NO DISPONIBLE (no hay datos de módulos en /me). */
  moduleLabel: string | null;
  /** NO DISPONIBLE (no hay datos de lecciones "siguientes" en /me). */
  nextLessonTitle: string | null;
  /** FIJO: el back no tiene portada/gradiente por curso. */
  coverGradient: string;
}

export interface DashboardView {
  /** REAL: GET /subscriptions/me (premium activa → PRO). */
  plan: "FREE" | "PRO";
  /** REAL: cantidad de inscripciones activas. */
  activeCoursesCount: number;
  /** REAL: GET /course-enrollments/me + GET /lesson-progress/me. */
  activeCourses: DashboardActiveCourse[];
  /** REAL PARCIAL: inscripción más reciente sin terminar. */
  continueLearning: DashboardContinue | null;
}

const DIFFICULTY_LABEL: Record<CourseDifficulty, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const CONTINUE_GRADIENT = "from-indigo-600 to-violet-800";

interface RawDashboardData {
  enrollments: RawEnrollment[];
  progress: RawLessonProgress[];
  subscriptions: RawSubscription[];
}

export function buildDashboardView({
  enrollments,
  progress,
  subscriptions,
}: RawDashboardData): DashboardView {
  const completedByEnrollment = countCompletedByEnrollment(progress);

  const activeCourses: DashboardActiveCourse[] = enrollments.map((enrollment) => ({
    id: enrollment.id,
    courseId: enrollment.course.id,
    title: enrollment.course.title,
    slug: enrollment.course.slug,
    description: enrollment.course.description ?? "",
    categoryLabel: DIFFICULTY_LABEL[enrollment.course.difficulty] ?? "Curso",
    imageUrl: enrollment.course.imageUrl ?? null,
    coverGradient: gradientFor(enrollment.course.id),
    progressPercent: clampPercent(enrollment.progressPercent),
    completedLessons: completedByEnrollment.get(enrollment.id) ?? 0,
    totalLessons: null, // TODO(back): GET /course-enrollments/me no trae el total de lecciones.
    isCompleted: enrollment.completedAt !== null,
    enrolledAt: enrollment.enrolledAt,
    href: `/courses/${enrollment.course.slug}`,
  }));

  return {
    plan: hasActivePremium(subscriptions) ? "PRO" : "FREE",
    activeCoursesCount: enrollments.length,
    activeCourses,
    continueLearning: pickContinueLearning(enrollments),
  };
}

/* enrollments ya viene ordenado por enrolledAt DESC desde el back. Elegimos el
   más reciente que todavía no esté al 100%; si están todos completos, el más
   reciente igual. */
function pickContinueLearning(
  enrollments: RawEnrollment[],
): DashboardContinue | null {
  if (enrollments.length === 0) return null;

  const target =
    enrollments.find((e) => clampPercent(e.progressPercent) < 100) ??
    enrollments[0];

  return {
    courseTitle: target.course.title,
    progressPercent: clampPercent(target.progressPercent),
    href: `/courses/${target.course.slug}`,
    moduleLabel: null, // NO DISPONIBLE
    nextLessonTitle: null, // NO DISPONIBLE
    coverGradient: CONTINUE_GRADIENT,
  };
}

/* Racha, horas estudiadas y logros NO pasan por acá: los cargan StreakCard,
   StudiedTimeCard y AchievementsCountCard desde services/progress/ y
   services/gamification/, cada tarjeta con su propio estado de error. De este
   archivo sale sólo `activeCoursesCount`. */

function countCompletedByEnrollment(
  progress: RawLessonProgress[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const record of progress) {
    if (!record.completed) continue;
    const enrollmentId = record.enrollment?.id;
    if (!enrollmentId) continue;
    counts.set(enrollmentId, (counts.get(enrollmentId) ?? 0) + 1);
  }

  return counts;
}

/* `plan === "premium"` no hace falta chequearlo: el back nunca guarda una
   fila FREE (contratar el plan gratis no pasa por Stripe), así que toda
   Subscription es Premium. `isSubscriptionCurrentlyActive` es la única
   regla (incluye una CANCELLED todavía dentro del período pago). */
function hasActivePremium(subscriptions: RawSubscription[]): boolean {
  return subscriptions.some((subscription) =>
    isSubscriptionCurrentlyActive(subscription.status, subscription.endDate),
  );
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}
