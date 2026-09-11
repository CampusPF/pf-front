import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";

import CourseFilters from "@/components/course/CourseFilters";
import CourseGrid from "@/components/course/CourseGrid";
import { getCategories, getCourses } from "@/services/courses/courses.service";
import type { CategoryOption, CourseFilters as Filters, CourseLevel } from "@/services/courses/courses.types";

export const metadata: Metadata = {
  title: "Cursos — Campus",
  description:
    "Catálogo de cursos de Campus: rutas estructuradas con proyectos reales y un tutor de IA en cada lección.",
};

/* Se renderiza en cada request: sin esto Next prerenderiza la página en el
   build, y si el back no está levantado en ese momento el catálogo queda
   vacío "congelado" hasta el próximo deploy. */
export const dynamic = "force-dynamic";

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toFilters(params: Record<string, string | string[] | undefined>): Filters {
  const list = (key: string) => first(params[key])?.split(",").filter(Boolean) ?? [];
  const price = first(params.precio);

  return {
    search: first(params.q) || undefined,
    levels: list("nivel").filter((l): l is CourseLevel => LEVELS.includes(l as CourseLevel)),
    categories: list("categoria"),
    isFree: price === "free" ? true : price === "premium" ? false : undefined,
    page: Number(first(params.pagina)) || 1,
  };
}

function pageHref(params: Record<string, string | string[] | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = first(value);
    if (v && key !== "pagina") query.set(key, v);
  }
  if (page > 1) query.set("pagina", String(page));
  const serialized = query.toString();
  return serialized ? `/courses?${serialized}` : "/courses";
}

export default async function CoursesPage(props: PageProps<"/courses">) {
  const params = await props.searchParams;
  const filters = toFilters(params);

  let categories: CategoryOption[] = [];
  let result: Awaited<ReturnType<typeof getCourses>> | null = null;
  let error: string | null = null;

  try {
    [result, categories] = await Promise.all([
      getCourses(filters),
      getCategories().catch(() => [] as CategoryOption[]),
    ]);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "No pudimos cargar los cursos.";
  }

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
          <Suspense>
            <CourseFilters categories={categories} />
          </Suspense>

          <div className="min-w-0 flex-1">
            {error || !result ? (
              <p
                role="alert"
                className="bg-danger-subtle text-danger border-danger/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </p>
            ) : (
              <>
                <p className="text-text-muted mb-4 text-sm">
                  {result.meta.total} {result.meta.total === 1 ? "curso disponible" : "cursos disponibles"}
                </p>
                <CourseGrid courses={result.data} />

                {result.meta.totalPages > 1 && (
                  <nav aria-label="Paginación" className="mt-8 flex items-center justify-center gap-2">
                    {Array.from({ length: result.meta.totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={pageHref(params, page)}
                        aria-current={page === result.meta.page ? "page" : undefined}
                        className={`min-w-9 rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition-colors ${
                          page === result.meta.page
                            ? "bg-primary-solid border-transparent text-white"
                            : "border-border text-text-secondary hover:bg-surface-elevated"
                        }`}
                      >
                        {page}
                      </Link>
                    ))}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
