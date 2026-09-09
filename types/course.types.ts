/* Modelo de dominio de cursos. Por ahora sólo lo consumen los mocks de `data/`;
   cuando entre el backend, estas interfaces son el contrato del cliente. */

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type CourseCategory =
  | "web-development"
  | "ai"
  | "databases"
  | "devops";

export interface Instructor {
  name: string;
  title: string;
  avatarUrl: string | null;
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
  /** Las lecciones gratis se ven sin suscripción (la protección real llega con auth). */
  isFree: boolean;
}

export interface Module {
  id: string;
  order: number;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: CourseCategory;
  categoryLabel: string;
  level: CourseLevel;
  levelLabel: string;
  durationHours: number;
  projectsCount: number;
  rating: number;
  studentsCount: number;
  instructor: Instructor;
  tags: string[];
  /** Clases de Tailwind para el gradiente de portada, ej. "from-blue-600 to-indigo-800". */
  coverGradient: string;
  isPremium: boolean;
  /** Precio de compra individual (de por vida), en la unidad menor de la
      moneda — 4999 = $49.99. Sólo aplica si isPremium; los cursos gratis lo
      dejan en 0. Independiente del precio de la suscripción mensual: un
      curso premium se puede conseguir comprándolo suelto O con Premium. */
  priceInCents: number;
  currency: string;
  modules: Module[];
}

export interface LessonContent {
  markdown: string;
  videoId: string | null;
}
