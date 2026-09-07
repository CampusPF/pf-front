import { apiFetch } from "@/services/api-client";
import type { PaginatedResponse, PaginationMeta } from "@/services/api.types";
import { applyClientFilters } from "@/services/courses/courses.client-filter";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type Course,
  type CourseFilters,
} from "@/services/courses/courses.types";

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
type RawCourseList = Course[] | PaginatedResponse<Course>;

function readList(raw: RawCourseList): {
  items: Course[];
  meta: PaginationMeta | null;
} {
  if (Array.isArray(raw)) return { items: raw, meta: null };
  return { items: raw.data ?? [], meta: raw.meta ?? null };
}

/** Pide el listado crudo al back, sin filtrar. Uso interno. */
async function requestCourseList(
  filters?: CourseFilters,
): Promise<{ items: Course[]; meta: PaginationMeta | null }> {
  const raw = await apiFetch<RawCourseList>("/courses", {
    query: filters && {
      category: filters.category,
      level: filters.level,
      isFree: filters.isFree,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    },
  });

  return readList(raw);
}

/**
 * `GET /courses` — listado paginado y filtrado.
 * Siempre devuelve la forma del contrato, filtre quien filtre.
 */
export async function getCourses(
  filters: CourseFilters = {},
): Promise<PaginatedResponse<Course>> {
  if (CLIENT_SIDE_FILTERING) {
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

/**
 * Detalle de un curso por identificador.
 *
 * TODO(back): el contrato define `GET /courses/:slug`, pero el back hoy resuelve
 * por `id`. La firma recibe un identificador opaco justamente para que el día
 * que el back soporte slug alcance con pasarle el slug — no cambia nada acá.
 */
export async function getCourseByIdentifier(
  identifier: string,
): Promise<Course> {
  return apiFetch<Course>(`/courses/${encodeURIComponent(identifier)}`);
}

/**
 * Detalle a partir del slug de la URL (`/courses/[slug]`).
 *
 * TODO(back): mientras el detalle resuelva por `id`, resolvemos slug → id
 * contra el listado. Es un request de más y se borra entero cuando
 * `GET /courses/:slug` funcione: ahí esto pasa a ser
 * `getCourseByIdentifier(slug)`.
 *
 * Devuelve `null` si no existe, para que la página pueda llamar a `notFound()`.
 */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const { items } = await requestCourseList();
  const match = items.find((course) => course.slug === slug);

  if (!match) return null;

  return getCourseByIdentifier(match.id);
}
