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
  page?: number;
  limit?: number;
}

/** Opción de categoría para filtros y selects. */
export interface CategoryOption {
  id: string;
  name: string;
}

/* Defaults de paginación. Viven acá y no en la capa temporal de filtrado para
   que sobrevivan a su borrado. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
