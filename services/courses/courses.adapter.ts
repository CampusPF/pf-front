import type {
  Course,
  CourseLevel,
  Lesson,
  LessonContent,
  LessonDetail,
  Module,
} from "@/types/course.types";
import type {
  RawCourse,
  RawLesson,
  RawLessonView,
  RawModule,
} from "@/services/courses/courses.raw";

/* Back → dominio. Es el ÚNICO lugar que conoce las dos formas: si el back
   cambia un nombre, se toca acá y ningún componente se entera.

   Qué es real y qué no, campo por campo:
   - REAL: id, slug, title, description, difficulty→level, imageUrl, precio,
     moneda, isActive, categoría (nombre), instructor (nombre, avatar), módulos.
   - DERIVADO: isPremium (precio > 0), durationHours (suma de lecciones, si
     vienen), coverGradient (fijo por id, sólo se ve si no hay imagen).
   - NO EXISTE EN EL BACK → null/vacío y la UI lo oculta: subtitle, rating,
     studentsCount, projectsCount, tags, instructor.title. TODO(back). */

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const GRADIENTS = [
  "from-blue-600 to-indigo-800",
  "from-violet-600 to-fuchsia-800",
  "from-emerald-600 to-teal-800",
  "from-amber-500 to-orange-700",
  "from-rose-500 to-pink-800",
  "from-sky-500 to-cyan-800",
];

/** Mismo curso → mismo gradiente siempre (hash simple del id). */
export function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function toLesson(raw: RawLesson): Lesson {
  return {
    id: raw.id,
    order: raw.order ?? 0,
    title: raw.title,
    durationMinutes: raw.durationMinutes ?? 0,
    isFree: Boolean(raw.isFree),
  };
}

export function toModule(raw: RawModule, lessons?: RawLesson[]): Module {
  const source = lessons ?? raw.lessons ?? [];
  return {
    id: raw.id,
    order: raw.order ?? 0,
    title: raw.title,
    lessons: source.filter((lesson) => lesson.isActive !== false).map(toLesson),
  };
}

export function totalHours(modules: Module[]): number | null {
  const minutes = modules.reduce(
    (acc, m) => acc + m.lessons.reduce((sum, l) => sum + l.durationMinutes, 0),
    0,
  );
  return minutes > 0 ? Math.max(1, Math.round(minutes / 60)) : null;
}

export function toCourse(raw: RawCourse): Course {
  const level: CourseLevel = raw.difficulty in LEVEL_LABEL ? raw.difficulty : "beginner";
  const rawModules = (raw.modules ?? []).filter((m) => m.isActive !== false);
  const modules = rawModules.map((m) => toModule(m));
  // Si algún módulo llegó sin la clave `lessons`, el back no las mandó (no es
  // que estén vacías): hay que pedirlas aparte.
  const lessonsIncluded = rawModules.every((m) => Array.isArray(m.lessons));

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    subtitle: null,
    description: raw.description ?? "",
    category: raw.category?.id ?? "",
    categoryLabel: raw.category?.name ?? "General",
    level,
    levelLabel: LEVEL_LABEL[level],
    durationHours: totalHours(modules),
    projectsCount: null,
    rating: null,
    studentsCount: null,
    instructor: {
      id: raw.instructor?.id,
      name: raw.instructor?.name ?? "Equipo Campus",
      title: null,
      avatarUrl: raw.instructor?.avatarUrl ?? null,
    },
    tags: [],
    imageUrl: raw.imageUrl ?? null,
    coverGradient: gradientFor(raw.id),
    isPremium: (raw.priceInCents ?? 0) > 0,
    priceInCents: raw.priceInCents ?? 0,
    currency: raw.currency ?? "usd",
    isActive: raw.isActive,
    modules,
    syllabusStatus: lessonsIncluded ? "complete" : "modules-only",
  };
}

/* youtube.com/watch?v=ID · youtu.be/ID · youtube.com/embed/ID */
export function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match?.[1] ?? null;
}

export function toLessonDetail(raw: RawLessonView): LessonDetail {
  const hasContent = Boolean(raw.content || raw.videoUrl);
  const videoId = raw.videoUrl ? youtubeId(raw.videoUrl) : null;

  const content: LessonContent | null = hasContent
    ? {
        markdown: raw.content ?? "",
        videoId,
        videoUrl: videoId ? null : raw.videoUrl,
      }
    : null;

  return { ...toLesson(raw), hasAccess: raw.hasAccess, content };
}
