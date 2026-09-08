import type { Metadata } from "next";

import { MOCK_COURSES } from "@/data/courses.mock";
import CourseFilters from "@/components/course/CourseFilters";
import CourseGrid from "@/components/course/CourseGrid";

export const metadata: Metadata = {
  title: "Cursos — Campus",
  description:
    "Catálogo de cursos de Campus: rutas estructuradas con proyectos reales y un tutor de IA en cada lección.",
};

export default function CoursesPage() {
  return (
    <main className="bg-bg flex-1">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        <header className="pb-6">
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            Catálogo oficial
          </p>
          <h1 className="text-text mt-2 text-3xl font-bold md:text-4xl">
            Cursos que te llevan a producción
          </h1>
          <p className="text-text-secondary mt-3 max-w-2xl">
            Empezá por lo que necesitás hoy: cada ruta cierra con proyectos que
            podés mostrar, y el tutor de IA te acompaña adentro de cada lección.
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <CourseFilters />

          <div className="min-w-0 flex-1">
            <p className="text-text-muted mb-4 text-sm">
              {MOCK_COURSES.length} cursos disponibles
            </p>
            {/* TODO(campus): la grilla muestra todo el catálogo. El filtrado real
                entra cuando los filtros pasen a searchParams. */}
            <CourseGrid courses={MOCK_COURSES} />
          </div>
        </div>
      </div>
    </main>
  );
}
