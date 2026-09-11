/* Formas CRUDAS que devuelve el back hoy (entidades de TypeORM serializadas).
   Nadie fuera de services/ las usa: el adapter las pasa al modelo de dominio
   de `@/types/course.types`. */

export type RawDifficulty = "beginner" | "intermediate" | "advanced";

export interface RawCategory {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  color?: string | null;
  icon?: string | null;
  isActive: boolean;
}

/** El instructor llega como el User completo (sin passwordHash). */
export interface RawInstructor {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface RawLesson {
  id: string;
  title: string;
  order: number;
  durationMinutes: number;
  isFree: boolean;
  isActive?: boolean;
}

export interface RawModule {
  id: string;
  title: string;
  order: number;
  isActive?: boolean;
  /** TODO(back): `GET /courses/:id` no la incluye todavía. */
  lessons?: RawLesson[];
}

export interface RawCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: RawDifficulty;
  imageUrl: string | null;
  imagePublicId?: string | null;
  priceInCents: number;
  currency: string;
  isActive: boolean;
  createdAt?: string;
  category?: RawCategory | null;
  instructor?: RawInstructor | null;
  /** Sólo en el detalle (`GET /courses/:id`). */
  modules?: RawModule[];
}

/** `GET /lessons/:id` — content/videoUrl en null si no hay acceso. */
export interface RawLessonView extends RawLesson {
  hasAccess: boolean;
  content: string | null;
  videoUrl: string | null;
  module?: { id: string; title: string; order: number } | null;
}
