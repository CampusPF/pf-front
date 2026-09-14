import type { PaginatedResponse } from "@/services/api.types";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type Course,
  type CourseFilters,
} from "@/services/courses/courses.types";

/* ⚠️ CAPA TEMPORAL ⚠️
   ────────────────────────────────────────────────────────────────
   TODO(back): `GET /courses` ignora los query params (?category, ?level,
   ?isFree, ?search, ?page, ?limit) y devuelve el listado completo. Mientras
   tanto filtramos y paginamos en el cliente.

   Está aislado en su propio archivo a propósito: cuando el back lo haga
   server-side, se pone `CLIENT_SIDE_FILTERING = false` en courses.service.ts y
   este archivo se borra entero. No agregues acá lógica que no sea el parche —
   si algo tiene que sobrevivir a la migración, va en el service.

   Ojo con el costo: esto trae TODOS los cursos en cada request. Sirve para el
   catálogo actual (3 cursos); no escala a cientos. */


/* Comparación sin acentos ni mayúsculas, para que "programacion" matchee
   "Programación". NFD separa la tilde en un combining char y lo borramos.
   (Rango ̀-ͯ en vez de \p{Diacritic}: el target es ES2017 y las
   unicode property escapes necesitan ES2018.) */
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function words(value: string): string[] {
  return normalizeText(value).split(/[^a-z0-9ñ]+/).filter(Boolean);
}

/* Busca sólo en el título, por inicio de palabra: cada palabra buscada tiene
   que ser el comienzo de alguna palabra del título ("react ty" → "React
   Avanzado con TypeScript", "ux" → "Fundamentos de UX/UI").

   Antes miraba también descripción, instructor, categoría, nivel y tags, y
   por substring: con dos letras ("da") matcheaba medio catálogo por palabras
   como "fundamentos" o por la descripción, y los resultados no tenían nada
   que ver con lo buscado. Categoría y nivel ya tienen su propio filtro. */
function matchesSearch(course: Course, search: string): boolean {
  const terms = words(search);
  if (terms.length === 0) return true;

  const titleWords = words(course.title);
  return terms.every((term) => titleWords.some((word) => word.startsWith(term)));
}

export function filterCourses(
  courses: Course[],
  filters: CourseFilters,
): Course[] {
  return courses.filter((course) => {
    if (filters.categories?.length && !filters.categories.includes(course.category)) {
      return false;
    }
    if (filters.levels?.length && !filters.levels.includes(course.level)) return false;

    // El contrato habla de `isFree`; el modelo tiene `isPremium`.
    if (filters.isFree !== undefined && course.isPremium === filters.isFree) {
      return false;
    }

    if (filters.search && !matchesSearch(course, filters.search)) return false;

    return true;
  });
}

/** Filtra + pagina en memoria y arma el `meta` que el contrato promete. */
export function applyClientFilters(
  courses: Course[],
  filters: CourseFilters = {},
): PaginatedResponse<Course> {
  const filtered = filterCourses(courses, filters);

  const total = filtered.length;
  const limit = Math.max(1, filters.limit ?? DEFAULT_LIMIT);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  // Si piden una página que no existe, devolvemos la última en vez de vacío.
  const page = Math.min(Math.max(1, filters.page ?? DEFAULT_PAGE), totalPages);

  const start = (page - 1) * limit;

  return {
    data: filtered.slice(start, start + limit),
    meta: { total, page, limit, totalPages },
  };
}
