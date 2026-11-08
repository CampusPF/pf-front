import { filterCourses } from "@/services/courses/courses.client-filter";
import type { CourseFilters } from "@/services/courses/courses.types";
import type { Course } from "@/types/course.types";

/* El tutor «se adelanta» cuando una búsqueda del catálogo no devuelve nada:
   en vez de dejar la grilla vacía, propone el curso más cercano a lo que se
   pidió. Va aflojando los filtros de a uno, del menos al más importante para
   el alumno: primero el texto buscado y la valoración, después el nivel y el
   precio, y por último la categoría. Si nada coincide, sugiere el mejor
   valorado del catálogo. */

export interface SugerenciaCurso {
  curso: Course;
  /** Por qué este curso, en una frase corta que completa «Te sugiero …». */
  motivo: string;
}

const mejor = (cursos: Course[]): Course | undefined =>
  [...cursos].sort(
    (a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      (b.studentsCount ?? 0) - (a.studentsCount ?? 0) ||
      a.title.localeCompare(b.title),
  )[0];

export function sugerirCurso(todos: Course[], filtros: CourseFilters): SugerenciaCurso | null {
  if (todos.length === 0) return null;

  const intentos: { filtros: CourseFilters; motivo: (c: Course) => string }[] = [
    {
      filtros: { ...filtros, search: undefined, minRating: undefined },
      motivo: (c) => `es de ${c.categoryLabel.toLowerCase()} y cumple el resto de tus filtros`,
    },
    {
      filtros: { categories: filtros.categories },
      motivo: (c) => `es de la categoría que elegiste (${c.categoryLabel})`,
    },
  ];

  const hayFiltros = Boolean(
    filtros.search || filtros.levels?.length || filtros.categories?.length ||
      filtros.isFree !== undefined || filtros.minRating !== undefined,
  );
  if (!hayFiltros) return null;

  for (const intento of intentos) {
    const curso = mejor(filterCourses(todos, intento.filtros));
    if (curso) return { curso, motivo: intento.motivo(curso) };
  }

  const curso = mejor(todos)!;
  return { curso, motivo: "es de los mejor valorados del catálogo" };
}
