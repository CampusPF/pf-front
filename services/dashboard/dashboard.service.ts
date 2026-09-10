import { apiFetch } from "@/services/api-client";
import type {
  RawAiTutorUsage,
  RawEnrollment,
  RawLessonProgress,
} from "@/services/dashboard/dashboard.types";

/* Endpoints reales que hoy alimentan el dashboard. Todos requieren el Bearer
   (auth: true). Cada uno es un GET simple; la agregación/normalización a la
   forma que usan los componentes está en dashboard.view.ts.

   Lo que NO existe todavía en el back y sigue mockeado (ver dashboard.view.ts):
   racha, logros, horas estudiadas, total de lecciones por curso, módulo /
   próxima lección del card "Continuá donde dejaste", y los cursos
   recomendados (el `Course` del back no tiene los campos que pide CourseCard). */

export function getMyEnrollments(signal?: AbortSignal) {
  return apiFetch<RawEnrollment[]>("/course-enrollments/me", {
    auth: true,
    signal,
  });
}

export function getMyLessonProgress(signal?: AbortSignal) {
  return apiFetch<RawLessonProgress[]>("/lesson-progress/me", {
    auth: true,
    signal,
  });
}

/* Las suscripciones viven en su propio módulo porque también las usa la
   pantalla de configuración (que además puede cancelarlas). Se re-exporta para
   que quien ya consumía el dashboard no tenga que cambiar el import. */
export { getMySubscriptions } from "@/services/subscriptions/subscriptions.service";

export function getMyAiTutorUsage(signal?: AbortSignal) {
  return apiFetch<RawAiTutorUsage>("/ai-tutor/usage/me", { auth: true, signal });
}
