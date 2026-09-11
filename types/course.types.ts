/* Modelo de dominio de cursos: lo único que conocen los componentes.

   Sale de dos fuentes con la misma forma (ver services/courses/):
   - el back, pasado por `courses.adapter.ts`;
   - los mocks de `data/`, si NEXT_PUBLIC_COURSES_SOURCE=mock.

   Los campos que el back todavía no tiene (rating, alumnos, proyectos, tags,
   subtítulo, título del instructor) son `null`/vacíos para los cursos reales y
   la UI los oculta: preferimos no mostrar un dato a mostrar uno inventado. */

export type CourseLevel = "beginner" | "intermediate" | "advanced";

/** Id de la categoría en el back (uuid). En los mocks es un slug fijo. */
export type CourseCategory = string;

export interface Instructor {
  id?: string;
  name: string;
  /** TODO(back): el User no tiene "título/cargo". `null` para cursos reales. */
  title: string | null;
  avatarUrl: string | null;
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
  /** Lección de muestra: se ve sin comprar el curso. */
  isFree: boolean;
}

export interface Module {
  id: string;
  order: number;
  title: string;
  lessons: Lesson[];
}

/**
 * "complete" = los módulos traen sus lecciones.
 * "modules-only" = TODO(back): `GET /courses/:id` trae los módulos pero no sus
 * lecciones; hay que pedirlas aparte (con sesión) — ver `loadSyllabus`.
 */
export type SyllabusStatus = "complete" | "modules-only";

export interface Course {
  id: string;
  slug: string;
  title: string;
  /** TODO(back): no existe. `null` para cursos reales. */
  subtitle: string | null;
  description: string;
  category: CourseCategory;
  categoryLabel: string;
  level: CourseLevel;
  levelLabel: string;
  /** Suma de las lecciones si el temario está cargado; si no, `null`. */
  durationHours: number | null;
  /** TODO(back): no existen. `null` para cursos reales. */
  projectsCount: number | null;
  rating: number | null;
  studentsCount: number | null;
  instructor: Instructor;
  /** TODO(back): no existe. Vacío para cursos reales. */
  tags: string[];
  /** Portada subida a Cloudinary. Si no hay, se usa `coverGradient`. */
  imageUrl?: string | null;
  /** Clases de Tailwind para el gradiente de portada (fallback sin imagen). */
  coverGradient: string;
  isPremium: boolean;
  /** Precio de compra individual en la unidad menor de la moneda (4999 = $49.99). */
  priceInCents: number;
  currency: string;
  /** Sólo lo ve el admin (los listados públicos filtran inactivos). */
  isActive?: boolean;
  modules: Module[];
  syllabusStatus?: SyllabusStatus;
}

/** Contenido de una lección para el player. */
export interface LessonContent {
  markdown: string;
  /** Id de YouTube, si el video es de YouTube. */
  videoId: string | null;
  /** URL directa (mp4/Cloudinary) cuando no es YouTube. */
  videoUrl?: string | null;
}

/** `GET /lessons/:id` ya adaptado. */
export interface LessonDetail extends Lesson {
  /** `false` = curso pago sin inscripción ni suscripción: content/video vienen en null. */
  hasAccess: boolean;
  content: LessonContent | null;
}
