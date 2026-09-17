import type { User } from "@/services/auth/auth.types";
import type { CourseProgress } from "@/services/progress/course-progress.service";
import type { Course, Lesson } from "@/types/course.types";

/* Qué lecciones puede abrir el usuario. Es la ÚNICA regla del front: la usan
   el temario del detalle (candados), la sidebar del reproductor y el propio
   reproductor, así no pueden discrepar entre sí.

   Una lección se abre si:
   - el usuario es admin (ve todo el catálogo para decidir qué eliminar);
   - es el docente que dicta ESE curso;
   - está inscripto al curso;
   - tiene una suscripción Premium activa;
   - o la lección está marcada como gratis (`isFree`, la vista previa).
   Todo lo demás queda bloqueado, aunque el curso sea gratis: en un curso
   gratis la inscripción es un click, y entrar a la lección gratis ya inscribe
   (ver LessonPlayer).

   Un docente NO tiene pase libre en los cursos de otros: sólo tiene gratis los
   gratuitos y los suyos; un curso pago ajeno lo compra o lo cursa con Premium,
   como cualquier alumno.

   Es la misma regla que aplica el back (LessonsAccessService en pf-back), que
   es el que de verdad nulea content/videoUrl. Acá sólo sirve para dibujar
   candados y links sin preguntarle lección por lección. Si cambia una, cambia
   la otra. */

export type LessonAccessContext = {
  /** Acceso por rol a ESTE curso: admin, o el docente que lo dicta. */
  hasRoleAccess: boolean;
  isEnrolled: boolean;
  hasActiveSubscription: boolean;
};

export function isStaffRole(role: User["role"] | undefined): boolean {
  return role === "admin" || role === "teacher";
}

/** ¿Este usuario dicta este curso? */
export function isCourseInstructor(
  user: Pick<User, "id" | "role"> | null | undefined,
  course: Pick<Course, "instructor"> | null | undefined,
): boolean {
  return (
    user?.role === "teacher" &&
    Boolean(course?.instructor.id) &&
    course?.instructor.id === user.id
  );
}

export function buildLessonAccess(
  user: User | null,
  progress: CourseProgress | null,
  course: Pick<Course, "instructor"> | null,
): LessonAccessContext {
  return {
    hasRoleAccess: user?.role === "admin" || isCourseInstructor(user, course),
    isEnrolled: Boolean(progress?.enrollmentId),
    hasActiveSubscription: progress?.hasActiveSubscription ?? false,
  };
}

/** Acceso a todo el curso, sin depender de qué lecciones son gratis. */
export function hasFullCourseAccess(access: LessonAccessContext): boolean {
  return access.hasRoleAccess || access.isEnrolled || access.hasActiveSubscription;
}

export function canOpenLesson(lesson: Pick<Lesson, "isFree">, access: LessonAccessContext): boolean {
  return hasFullCourseAccess(access) || lesson.isFree;
}

/**
 * Entrar a una lección inscribe al usuario si la inscripción no cuesta nada:
 * curso gratis, o cualquier curso con Premium activo, siendo admin, o siendo
 * el docente del curso (el back acepta POST /course-enrollments en esos
 * casos). Así el curso queda "empezado" en el detalle y en el dashboard, y
 * puede registrar progreso. Un curso pago para quien no tiene ninguna de esas
 * — alumno o docente ajeno sin Premium — no: la inscripción la crea el pago.
 */
export function shouldAutoEnroll(course: Pick<Course, "isPremium">, access: LessonAccessContext): boolean {
  if (access.isEnrolled) return false;
  return !course.isPremium || access.hasActiveSubscription || access.hasRoleAccess;
}
