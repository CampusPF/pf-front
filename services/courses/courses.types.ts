import type { CourseLevel } from "@/types/course.types";

/* El `Course` del dominio vive en `@/types/course.types` y es el mismo que
   consumen las views: lo reexportamos para tener todo desde un solo import. */
export type {
  Course,
  CourseCategory,
  CourseLevel,
  Instructor,
  Lesson,
  LessonDetail,
  Module,
} from "@/types/course.types";

/** Filtros del catálogo. */
export interface CourseFilters {
  /** Ids de categoría; vacío = todas. */
  categories?: string[];
  levels?: CourseLevel[];
  /** `true` = sólo gratis, `false` = sólo premium, `undefined` = todos. */
  isFree?: boolean;
  search?: string;
  /** Valoración mínima (promedio). Excluye los cursos sin reseñas. */
  minRating?: number;
  sort?: CourseSort;
  page?: number;
  limit?: number;
}

/** Orden del catálogo. "recent" es el orden natural del back. */
export type CourseSort = "recent" | "top-rated" | "popular";

/* `value` es lo que va en la URL (?orden=), en español como el resto de los
   params del catálogo. */
export const SORT_OPTIONS: { value: string; sort: CourseSort; label: string }[] = [
  { value: "", sort: "recent", label: "Más nuevos" },
  { value: "valorados", sort: "top-rated", label: "Mejor valorados" },
  { value: "populares", sort: "popular", label: "Más populares" },
];

/* ?valoracion=4 → "4★ o más". Sin 5: con un promedio a un decimal, "5 o más"
   sería "sólo perfectos" y dejaría la grilla casi siempre vacía. */
export const MIN_RATING_OPTIONS = [4.5, 4, 3] as const;

/** Opción de categoría para filtros y selects. */
export interface CategoryOption {
  id: string;
  name: string;
}

/* Defaults de paginación. Viven acá y no en la capa temporal de filtrado para
   que sobrevivan a su borrado. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
