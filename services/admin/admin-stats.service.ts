import { apiFetch } from "@/services/api-client";

/* Métricas del panel: `GET /admin/stats?days=`.

   Todo llega ya agregado desde el back (COUNT/SUM en SQL): antes el front
   pedía los listados completos de usuarios, cursos, inscripciones y
   suscripciones y los contaba con `.length`.

   El alcance lo decide el BACK según el rol del token: el admin recibe la
   plataforma (`scope: "platform"`) y el docente sólo sus cursos (`"teacher"`),
   con los campos de plataforma en `null`. Acá no se filtra nada. */

export const STATS_RANGES = [7, 30, 90, 365] as const;
export type StatsRange = (typeof STATS_RANGES)[number];

/** Un valor del período elegido contra el período anterior de igual largo. */
export interface PeriodMetric {
  current: number;
  previous: number;
}

export interface AdminStats {
  scope: "platform" | "teacher";
  /** Fechas locales `YYYY-MM-DD`, ambas incluidas. */
  range: { days: StatsRange; from: string; to: string };
  currency: string;
  totals: {
    /** Sólo admin. */
    users: number | null;
    /** Admin: alumnos de la plataforma. Docente: alumnos distintos en sus cursos. */
    students: number;
    /** Sólo admin. */
    teachers: number | null;
    courses: number;
    activeCourses: number;
    /** Sólo admin. */
    categories: number | null;
    enrollments: number;
    completedEnrollments: number;
    /** Sólo admin. */
    activeSubscriptions: number | null;
    revenueCents: number;
    reviews: number;
    /** Un decimal; `null` sin reseñas. */
    averageRating: number | null;
  };
  period: {
    newStudents: PeriodMetric;
    enrollments: PeriodMetric;
    completions: PeriodMetric;
    revenueCents: PeriodMetric;
  };
  /** Un punto por día del rango, incluidos los días en cero. */
  enrollmentsByDay: { date: string; count: number }[];
  /** Últimos 12 meses (`YYYY-MM`), incluidos los meses en cero. */
  revenueByMonth: { month: string; courseCents: number; subscriptionCents: number }[];
  topCourses: { id: string; title: string; enrollments: number }[];
  recentEnrollments: {
    id: string;
    studentName: string;
    courseTitle: string;
    enrolledAt: string;
  }[];
}

export function getAdminStats(days: StatsRange, signal?: AbortSignal): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats", { auth: true, query: { days }, signal });
}
