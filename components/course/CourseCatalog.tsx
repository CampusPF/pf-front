import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";

import CourseFilters from "@/components/course/CourseFilters";
import CourseGrid from "@/components/course/CourseGrid";
import { getCategories, getCourses } from "@/services/courses/courses.service";
import CourseSort from "@/components/course/CourseSort";
import {
  MIN_RATING_OPTIONS,
  SORT_OPTIONS,
  type CategoryOption,
  type CourseFilters as Filters,
  type CourseLevel,
} from "@/services/courses/courses.types";

/* Catálogo de cursos (filtros + orden + grilla + paginación). Lo usan dos
   rutas: /courses (sitio público, con Navbar) y /dashboard/explorar (dentro
   del shell del dashboard, para no perder el sidebar al explorar).

   Filtros y orden ya navegan sobre la ruta actual (usePathname); la
   paginación arma sus links con `basePath`. */

type SearchParams = Record<string, string | string[] | undefined>;

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toFilters(params: SearchParams): Filters {
  const list = (key: string) => first(params[key])?.split(",").filter(Boolean) ?? [];
  const price = first(params.precio);
  // Sólo valores ofrecidos: un ?valoracion=7 a mano no deja la grilla vacía.
  const minRating = Number(first(params.valoracion));
  const sort = SORT_OPTIONS.find((option) => option.value === first(params.orden))?.sort;

  return {
    search: first(params.q) || undefined,
    levels: list("nivel").filter((l): l is CourseLevel => LEVELS.includes(l as CourseLevel)),
    categories: list("categoria"),
    isFree: price === "free" ? true : price === "premium" ? false : undefined,
    minRating: (MIN_RATING_OPTIONS as readonly number[]).includes(minRating) ? minRating : undefined,
    sort,
    page: Number(first(params.pagina)) || 1,
  };
}

function pageHref(basePath: string, params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = first(value);
    if (v && key !== "pagina") query.set(key, v);
  }
  if (page > 1) query.set("pagina", String(page));
  const serialized = query.toString();
  return serialized ? `${basePath}?${serialized}` : basePath;
}

export default async function CourseCatalog({
  params,
  basePath,
  className,
}: {
  params: SearchParams;
  /** Ruta donde vive el catálogo, para los links de paginación. */
  basePath: string;
  /** Contenedor: cada ruta tiene su propio padding (Navbar fijo vs. topbar). */
  className: string;
}) {
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
    <div className={className}>
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

      {/* `group`: CourseFilters marca data-pending mientras espera el render
          con los filtros nuevos, y la grilla se atenúa hasta que llega. */}
      <div className="group mt-6 flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <CourseFilters categories={categories} />
        </Suspense>

        <div className="min-w-0 flex-1 transition-opacity duration-150 group-has-data-pending:opacity-50">
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-text-muted text-sm">
                  {result.meta.total} {result.meta.total === 1 ? "curso disponible" : "cursos disponibles"}
                </p>
                <Suspense>
                  <CourseSort />
                </Suspense>
              </div>
              <CourseGrid courses={result.data} />

              {result.meta.totalPages > 1 && (
                <nav aria-label="Paginación" className="mt-8 flex items-center justify-center gap-2">
                  {Array.from({ length: result.meta.totalPages }, (_, i) => i + 1).map((page) => (
                    <Link
                      key={page}
                      href={pageHref(basePath, params, page)}
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
  );
}
