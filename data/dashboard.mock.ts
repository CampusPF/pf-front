import type { Course } from "@/types/course.types";
import { MOCK_COURSES } from "@/data/courses.mock";

/* TODO(back): lo que queda acá es SÓLO lo que el back todavía no expone.
   Ya salen de datos reales: el saludo, la inicial/nombre del sidebar, el plan
   FREE/PRO, "Mis cursos", "Continuá donde dejaste" y el stat "cursos activos"
   (ver services/dashboard/). Sigue mockeado:
     - DASHBOARD_STATS: racha, logros y horas estudiadas (no hay endpoints; las
       lecciones no tienen duración). El stat "cursos activos" se pisa con el
       valor real en dashboard.view.ts.
     - RECOMMENDED_COURSES: falta un adapter del catálogo back→front (mismo
       pendiente que en app/(marketing)/courses). */

export type StatKey = "streak" | "activeCourses" | "achievements" | "hours";

export interface DashboardStat {
  key: StatKey;
  value: string;
  label: string;
}

export const DASHBOARD_STATS: DashboardStat[] = [
  { key: "streak", value: "7 días", label: "de racha" },
  { key: "activeCourses", value: "4", label: "cursos activos" },
  { key: "achievements", value: "12", label: "logros" },
  { key: "hours", value: "18h", label: "estudiadas" },
];

/** Recomendados: reusamos cursos reales del catálogo mock para que las cards
    linkeen a su detalle. */
export const RECOMMENDED_COURSES: Course[] = MOCK_COURSES;
