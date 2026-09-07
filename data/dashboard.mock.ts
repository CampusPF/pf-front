import type { Course } from "@/types/course.types";
import { MOCK_COURSES } from "@/data/courses.mock";

/* TODO(campus): data del dashboard hardcodeada sólo para maquetar la home
   logueada. Cuando exista el back sale de GET /dashboard/me, GET /stats/me y
   GET /courses/me (ver "Api contract" del proyecto). */

export interface DashboardUser {
  name: string;
  plan: "FREE" | "PRO";
  role: string;
}

/** Card destacado "Continuá donde dejaste". */
export interface ContinueLearning {
  courseTitle: string;
  moduleLabel: string;
  nextLessonTitle: string;
  progressPercent: number;
  coverGradient: string;
  href: string;
}

export type StatKey = "streak" | "activeCourses" | "achievements" | "hours";

export interface DashboardStat {
  key: StatKey;
  value: string;
  label: string;
}

/** Curso activo con su avance, para la sección "Mis cursos". */
export interface ActiveCourse {
  id: string;
  categoryLabel: string;
  title: string;
  lessonCurrent: number;
  lessonTotal: number;
  progressPercent: number;
  href: string;
}

export const DASHBOARD_USER: DashboardUser = {
  name: "Cala",
  plan: "PRO",
  role: "Estudiante",
};

export const CONTINUE_LEARNING: ContinueLearning = {
  courseTitle: "JavaScript Moderno",
  moduleLabel: "Módulo 5",
  nextLessonTitle: "Async / Await",
  progressPercent: 78,
  coverGradient: "from-indigo-600 to-violet-800",
  href: "/courses/javascript-moderno/learn/l1",
};

export const DASHBOARD_STATS: DashboardStat[] = [
  { key: "streak", value: "7 días", label: "de racha" },
  { key: "activeCourses", value: "4", label: "cursos activos" },
  { key: "achievements", value: "12", label: "logros" },
  { key: "hours", value: "18h", label: "estudiadas" },
];

export const ACTIVE_COURSES: ActiveCourse[] = [
  {
    id: "1",
    categoryLabel: "Frontend",
    title: "React y Next.js Profesional",
    lessonCurrent: 12,
    lessonTotal: 28,
    progressPercent: 45,
    href: "/courses/fundamentos-de-react",
  },
  {
    id: "2",
    categoryLabel: "Backend",
    title: "Bases de Datos con PostgreSQL y Prisma",
    lessonCurrent: 24,
    lessonTotal: 26,
    progressPercent: 90,
    href: "/courses/nextjs-fullstack",
  },
  {
    id: "3",
    categoryLabel: "Diseño UI",
    title: "Diseño de Sistemas UI en Figma",
    lessonCurrent: 4,
    lessonTotal: 20,
    progressPercent: 20,
    href: "/courses/javascript-moderno",
  },
];

/** Recomendados: reusamos cursos reales del catálogo mock para que las cards
    linkeen a su detalle. */
export const RECOMMENDED_COURSES: Course[] = MOCK_COURSES;
