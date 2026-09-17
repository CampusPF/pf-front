import type { Course } from "@/types/course.types";
import { MOCK_COURSES } from "@/data/courses.mock";

/* TODO(back): lo que queda acá es SÓLO lo que el back todavía no expone.
   Ya salen de datos reales: el saludo, la inicial/nombre del sidebar, el plan
   FREE/PRO, "Mis cursos", "Continuá donde dejaste", el stat "cursos activos"
   (ver services/dashboard/) y la racha y horas estudiadas
   (services/progress/progress-stats.service.ts). Sigue mockeado:
     - DASHBOARD_STATS: logros (no hay endpoint). El stat "cursos activos" se
       pisa con el valor real en dashboard.view.ts.
     - RECOMMENDED_COURSES: falta un adapter del catálogo back→front (mismo
       pendiente que en app/(marketing)/courses). */

export type StatKey = "activeCourses" | "achievements";

export interface DashboardStat {
  key: StatKey;
  value: string;
  label: string;
}

export const DASHBOARD_STATS: DashboardStat[] = [
  // En 0 hasta que existan los endpoints: no mostrar números inventados.
  { key: "activeCourses", value: "0", label: "cursos activos" },
  { key: "achievements", value: "0", label: "logros" },
];

/** Recomendados: reusamos cursos reales del catálogo mock para que las cards
    linkeen a su detalle. */
export const RECOMMENDED_COURSES: Course[] = MOCK_COURSES;
