import { apiFetch } from "@/services/api-client";
import type { PaginatedResponse, PaginationMeta } from "@/services/api.types";
import { applyClientFilters } from "@/services/courses/courses.client-filter";
import {
  LEVEL_LABEL,
  toCourse,
  toLessonDetail,
  toModule,
  totalHours,
} from "@/services/courses/courses.adapter";
import type {
  RawCategory,
  RawCourse,
  RawLesson,
  RawLessonView,
} from "@/services/courses/courses.raw";
import { USE_MOCK_COURSES } from "@/services/courses/courses.source";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type CategoryOption,
  type Course,
  type CourseFilters,
  type LessonDetail,
} from "@/services/courses/courses.types";
import { MOCK_COURSES } from "@/data/courses.mock";
import { LESSON_CONTENT } from "@/data/lesson-content.mock";
import { findLesson } from "@/lib/course-utils";

/* Catálogo público + temario + lección. Todo devuelve el modelo de dominio,
   venga del back o de los mocks (ver courses.source.ts). */

/* TODO(back): `GET /courses` ignora los query params, así que mientras esté en
   `true` pedimos el listado completo y filtramos/paginamos en el cliente
   (ver courses.client-filter.ts).

   Cuando el back filtre server-side: poner esto en `false` y borrar
   courses.client-filter.ts. Es el único switch que hay que tocar.

   No mandamos los params igual "por las dudas": si el back empezara a
   paginar mientras el parche sigue activo, estaríamos paginando dos veces
   (página 2 del back, y después página 2 de ESA página) y saldría vacío. */
const CLIENT_SIDE_FILTERING = true;

/* TODO(back): el contrato promete `PaginatedResponse<Course>` (`{ data, meta }`)
   pero hoy el listado llega como array pelado. Aceptamos las dos formas. */
type RawCourseList = RawCourse[] | PaginatedResponse<RawCourse>;

async function requestCourseList(
  filters?: CourseFilters,
): Promise<{ items: Course[]; meta: PaginationMeta | null }> {
  if (USE_MOCK_COURSES) return { items: MOCK_COURSES, meta: null };

  const raw = await apiFetch<RawCourseList>("/courses", {
    query: filters && {
      category: filters.categories?.join(","),
      level: filters.levels?.join(","),
      isFree: filters.isFree,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    },
  });

  const list = Array.isArray(raw) ? raw : (raw.data ?? []);
  const meta = Array.isArray(raw) ? null : (raw.meta ?? null);
  return { items: list.map(toCourse), meta };
}

/** `GET /courses` — listado paginado y filtrado, siempre con la forma del contrato. */
export async function getCourses(
  filters: CourseFilters = {},
): Promise<PaginatedResponse<Course>> {
  if (CLIENT_SIDE_FILTERING || USE_MOCK_COURSES) {
    const { items } = await requestCourseList();
    return applyClientFilters(items, filters);
  }

  const { items, meta } = await requestCourseList(filters);

  return {
    data: items,
    meta: meta ?? {
      total: items.length,
      page: filters.page ?? DEFAULT_PAGE,
      limit: filters.limit ?? DEFAULT_LIMIT,
      totalPages: 1,
    },
  };
}

/** `GET /courses/:id` — detalle con módulos (y lecciones, si el back las manda). */
export async function getCourseById(id: string): Promise<Course> {
  if (USE_MOCK_COURSES) {
    const course = MOCK_COURSES.find((c) => c.id === id);
    if (!course) throw new Error("Curso no encontrado.");
    return course;
  }
  return toCourse(await apiFetch<RawCourse>(`/courses/${encodeURIComponent(id)}`));
}

/**
 * Detalle a partir del slug de la URL. `null` si no existe (→ `notFound()`).
 *
 * TODO(back): no hay `GET /courses/slug/:slug`, así que resolvemos slug → id
 * contra el listado (un request de más). Cuando exista, esto pasa a ser un
 * solo `apiFetch`.
 */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (USE_MOCK_COURSES) return MOCK_COURSES.find((c) => c.slug === slug) ?? null;

  const { items } = await requestCourseList();
  const match = items.find((course) => course.slug === slug);
  if (!match) return null;

  return getCourseById(match.id);
}

/**
 * Completa las lecciones de un curso que llegó con `syllabusStatus:
 * "modules-only"`. Requiere sesión (el guard JWT del back es global y
 * `GET /lessons` no es público), así que sólo sirve del lado del cliente.
 *
 * TODO(back): cuando `GET /courses/:id` incluya `modules.lessons` (y sea
 * público), esto devuelve el curso tal cual sin hacer requests.
 */
export async function loadSyllabus(course: Course): Promise<Course> {
  if (course.syllabusStatus !== "modules-only") return course;

  const modules = await Promise.all(
    course.modules.map(async (courseModule) => {
      const lessons = await apiFetch<RawLesson[]>("/lessons", {
        query: { moduleId: courseModule.id },
        auth: true,
      });
      return toModule({ ...courseModule, lessons: undefined }, lessons);
    }),
  );

  return {
    ...course,
    modules,
    durationHours: totalHours(modules),
    syllabusStatus: "complete",
  };
}

/** `GET /lessons/:id` — con sesión. En modo mock sale de lesson-content.mock. */
export async function getLesson(course: Course, lessonId: string): Promise<LessonDetail | null> {
  if (USE_MOCK_COURSES) {
    const lesson = findLesson(course, lessonId);
    if (!lesson) return null;
    return { ...lesson, hasAccess: true, content: LESSON_CONTENT[lesson.id] ?? null };
  }

  const raw = await apiFetch<RawLessonView>(`/lessons/${encodeURIComponent(lessonId)}`, {
    auth: true,
  });
  return toLessonDetail(raw);
}

const MOCK_CATEGORY_OPTIONS: CategoryOption[] = [
  { id: "web-development", name: "Desarrollo Web" },
  { id: "ai", name: "Inteligencia Artificial" },
  { id: "databases", name: "Bases de Datos" },
  { id: "devops", name: "DevOps" },
];

/** `GET /categories` (público) — sólo las activas. */
export async function getCategories(): Promise<CategoryOption[]> {
  if (USE_MOCK_COURSES) return MOCK_CATEGORY_OPTIONS;

  const raw = await apiFetch<RawCategory[]>("/categories");
  return raw
    .filter((category) => category.isActive !== false)
    .map((category) => ({ id: category.id, name: category.name }));
}

export const LEVEL_OPTIONS = Object.entries(LEVEL_LABEL).map(([value, label]) => ({
  value: value as keyof typeof LEVEL_LABEL,
  label,
}));
