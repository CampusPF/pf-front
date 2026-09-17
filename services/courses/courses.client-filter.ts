import type { PaginatedResponse } from "@/services/api.types";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type Course,
  type CourseFilters,
  type CourseSort,
} from "@/services/courses/courses.types";

/* ⚠️ CAPA TEMPORAL ⚠️
   ────────────────────────────────────────────────────────────────
   TODO(back): `GET /courses` ignora los query params (?category, ?level,
   ?isFree, ?search, ?minRating, ?sort, ?page, ?limit) y devuelve el listado
   completo. Mientras tanto filtramos, ordenamos y paginamos en el cliente.
   El listado ya trae ratingAverage/reviewsCount/studentsCount por curso, así
   que ordenar por valoración o popularidad no necesita requests extra.

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

    // Sin reseñas no hay promedio que cumpla un mínimo: quedan afuera.
    if (filters.minRating !== undefined && (course.rating ?? 0) < filters.minRating) {
      return false;
    }

    return true;
  });
}

/* Cuántas reseñas "prestadas" del promedio general suma el ranking de mejor
   valorados. Con 3, un curso con una sola reseña de 5★ no le gana a uno con
   40 reseñas de 4.8: primero tiene que juntar opiniones. */
const RATING_PRIOR_WEIGHT = 3;

/**
 * Promedio bayesiano: tira el promedio de cada curso hacia el promedio del
 * catálogo en proporción a cuán pocas reseñas tiene.
 *   (n · promedio + m · promedioGeneral) / (n + m)
 */
function weightedRating(course: Course, catalogAverage: number): number {
  const n = course.reviewsCount;
  if (course.rating === null || n === 0) return -1; // sin reseñas: al final
  const m = RATING_PRIOR_WEIGHT;
  return (n * course.rating + m * catalogAverage) / (n + m);
}

/**
 * Ordena una copia. "recent" respeta el orden del back (createdAt DESC).
 *
 * `catalog` es de dónde sale el promedio general del ranking: tiene que ser el
 * catálogo COMPLETO, no los resultados filtrados. Si no, filtrar por "4 o más"
 * sube ese promedio y un curso con una sola reseña de 5★ pasa a ganarle a uno
 * con muchas — el orden cambiaría según el filtro, que no tiene sentido.
 */
export function sortCourses(
  courses: Course[],
  sort: CourseSort = "recent",
  catalog: Course[] = courses,
): Course[] {
  if (sort === "recent") return courses;

  // Array.prototype.sort es estable: los empates conservan el orden del back
  // (el más nuevo primero), que es el desempate que queremos.
  if (sort === "popular") {
    return [...courses].sort(
      (a, b) =>
        (b.studentsCount ?? 0) - (a.studentsCount ?? 0) || b.reviewsCount - a.reviewsCount,
    );
  }

  const rated = catalog.filter((c) => c.rating !== null && c.reviewsCount > 0);
  const totalReviews = rated.reduce((acc, c) => acc + c.reviewsCount, 0);
  const catalogAverage = totalReviews
    ? rated.reduce((acc, c) => acc + (c.rating ?? 0) * c.reviewsCount, 0) / totalReviews
    : 0;

  return [...courses].sort(
    (a, b) =>
      weightedRating(b, catalogAverage) - weightedRating(a, catalogAverage) ||
      b.reviewsCount - a.reviewsCount,
  );
}

/** Filtra + pagina en memoria y arma el `meta` que el contrato promete. */
export function applyClientFilters(
  courses: Course[],
  filters: CourseFilters = {},
): PaginatedResponse<Course> {
  const filtered = sortCourses(filterCourses(courses, filters), filters.sort, courses);

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
