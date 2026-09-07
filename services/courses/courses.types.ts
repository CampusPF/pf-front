import type { CourseCategory, CourseLevel } from "@/types/course.types";

/* El `Course` del contrato ya está definido en `@/types/course.types` y es el
   mismo que consumen las views, así que no lo duplicamos: lo reexportamos para
   que quien use el service tenga todo desde un solo import. */
export type {
  Course,
  CourseCategory,
  CourseLevel,
  Instructor,
  Lesson,
  Module,
} from "@/types/course.types";

/** Query params de `GET /courses` según el contrato. */
export interface CourseFilters {
  category?: CourseCategory;
  level?: CourseLevel;
  /** `true` = sólo gratis, `false` = sólo premium, `undefined` = todos. */
  isFree?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/* Defaults de paginación. Viven acá y no en la capa temporal de filtrado para
   que sobrevivan a su borrado. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
