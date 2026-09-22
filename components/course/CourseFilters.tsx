"use client";

import { startTransition, useEffect, useOptimistic, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, RotateCcw, Search, SlidersHorizontal, Star } from "lucide-react";

import { MIN_RATING_OPTIONS, type CategoryOption } from "@/services/courses/courses.types";
import { LEVEL_OPTIONS } from "@/services/courses/courses.service";
import { useRevalidateOnFocus } from "@/lib/use-revalidate-on-focus";

/* Los filtros viven en la URL (?q=&nivel=&categoria=&precio=&valoracion=; el
   orden, ?orden=, lo maneja CourseSort arriba de la grilla): el filtro es
   linkeable, sobrevive a recargar y la página los lee en el server.

   Cada cambio es una navegación que espera un render nuevo del server (que a
   su vez le pide el catálogo al back). En local es instantáneo; en
   producción, con el back lejos o frío, tarda — y sin feedback parecía que
   el buscador "no hacía nada". Por eso, como indica la guía de Next
   (docs/01-app/02-guides/interactive-apps.md):
   - la navegación corre dentro de una transición, con `useOptimistic` para
     que los checkboxes cambien en el acto y `data-pending` en el <aside>
     para que la grilla se atenúe (group-has-data-pending en la página);
   - la búsqueda se aplica sola mientras se escribe (debounce), sin depender
     de Enter, y la X nativa del input también la limpia.

   TODO(back): el filtro de duración se sacó — el listado del back no trae
   las lecciones, así que no hay duración para filtrar. */

const PRICES = [
  { value: "", label: "Todos" },
  { value: "free", label: "Gratis" },
  { value: "premium", label: "Premium" },
];

/* ?valoracion=4 → promedio de 4 o más. Los cursos sin reseñas quedan afuera
   de cualquier mínimo (no tienen promedio que lo cumpla). */
const RATINGS = [
  { value: "", label: "Todas" },
  ...MIN_RATING_OPTIONS.map((min) => ({
    value: String(min),
    label: `${String(min).replace(".", ",")} o más`,
  })),
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-text mb-3 text-sm font-semibold">{children}</h3>;
}

function readList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export default function CourseFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [optimisticQuery, setOptimisticQuery] = useOptimistic(searchParams.toString());
  const [isPending, setIsPending] = useOptimistic(false);
  const current = new URLSearchParams(optimisticQuery);

  // Si un docente/admin dio de alta, editó o eliminó un curso mientras esta
  // pestaña estaba de fondo, el catálogo se pone al día solo al volver —
  // router.refresh() vuelve a pedirle al server los mismos filtros que ya
  // están en la URL, sin tocarlos ni perder lo que el usuario tipeó acá.
  useRevalidateOnFocus(() => router.refresh());

  const levels = readList(current.get("nivel"));
  const selectedCategories = readList(current.get("categoria"));
  const price = current.get("precio") ?? "";
  const minRating = current.get("valoracion") ?? "";
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // El debounce llama a update() desde un timeout: la query se lee de un ref
  // para no pisar un filtro que se tocó mientras el timer corría.
  const queryRef = useRef(optimisticQuery);
  useEffect(() => {
    queryRef.current = optimisticQuery;
  }, [optimisticQuery]);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  // En mobile el panel arranca cerrado y se despliega con el botón "Filtrar".
  const [isOpen, setIsOpen] = useState(false);

  const activeCount =
    levels.length + selectedCategories.length + (price ? 1 : 0) + (minRating ? 1 : 0);

  function navigate(query: string) {
    queryRef.current = query;
    startTransition(() => {
      setOptimisticQuery(query);
      setIsPending(true);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(queryRef.current);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Cambiar un filtro vuelve a la primera página.
    params.delete("pagina");
    const query = params.toString();
    if (query !== queryRef.current) navigate(query);
  }

  function applySearch(value: string) {
    clearTimeout(searchTimer.current);
    update({ q: value.trim() || null });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(searchTimer.current);
    // Vaciar (a mano o con la X nativa) aplica en el acto; escribir espera
    // una pausa para no navegar con cada tecla.
    if (!value.trim()) applySearch(value);
    else searchTimer.current = setTimeout(() => applySearch(value), 400);
  }

  function toggleIn(key: string, list: string[], value: string) {
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    update({ [key]: next.join(",") || null });
  }

  return (
    <aside
      className="shrink-0 lg:w-60"
      data-pending={isPending ? "" : undefined}
      aria-busy={isPending}
    >
      {/* ── Trigger mobile ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="bg-surface border-border text-text hover:bg-surface-elevated flex w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150 lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtrar
          {activeCount > 0 && (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {/* ── Panel ───────────────────────────────────────────────── */}
      <div
        className={`${isOpen ? "block" : "hidden"} bg-surface border-border mt-3 rounded-xl border p-5 lg:sticky lg:top-24 lg:mt-0 lg:block`}
      >
        <form
          role="search"
          className="relative mb-6"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch(search);
          }}
        >
          {isPending ? (
            <Loader2
              className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin"
              aria-hidden
            />
          ) : (
            <Search
              className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar cursos…"
            aria-label="Buscar cursos"
            className="bg-bg border-border text-text placeholder:text-text-muted focus:border-primary focus:ring-primary/30 w-full rounded-lg border py-2 pr-3 pl-9 text-sm focus:ring-2 focus:outline-none"
          />
        </form>

        <section className="mb-6">
          <SectionTitle>Nivel</SectionTitle>
          <div className="space-y-2.5">
            {LEVEL_OPTIONS.map((level) => (
              <label
                key={level.value}
                className="text-text-secondary hover:text-text flex cursor-pointer items-center gap-2.5 text-sm transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  checked={levels.includes(level.value)}
                  onChange={() => toggleIn("nivel", levels, level.value)}
                  className="accent-primary size-4 cursor-pointer rounded"
                />
                {level.label}
              </label>
            ))}
          </div>
        </section>

        {categories.length > 0 && (
          <section className="mb-6">
            <SectionTitle>Categoría</SectionTitle>
            <div className="space-y-2.5">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="text-text-secondary hover:text-text flex cursor-pointer items-center gap-2.5 text-sm transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleIn("categoria", selectedCategories, category.id)}
                    className="accent-primary size-4 cursor-pointer rounded"
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </section>
        )}

        <section className="mb-6">
          <SectionTitle>Precio</SectionTitle>
          <div className="space-y-2.5">
            {PRICES.map((option) => (
              <label
                key={option.value || "all"}
                className="text-text-secondary hover:text-text flex cursor-pointer items-center gap-2.5 text-sm transition-colors duration-150"
              >
                <input
                  type="radio"
                  name="precio"
                  value={option.value}
                  checked={price === option.value}
                  onChange={() => update({ precio: option.value || null })}
                  className="accent-primary size-4 cursor-pointer"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <SectionTitle>Valoración</SectionTitle>
          <div className="space-y-2.5">
            {RATINGS.map((option) => (
              <label
                key={option.value || "all"}
                className="text-text-secondary hover:text-text flex cursor-pointer items-center gap-2.5 text-sm transition-colors duration-150"
              >
                <input
                  type="radio"
                  name="valoracion"
                  value={option.value}
                  checked={minRating === option.value}
                  onChange={() => update({ valoracion: option.value || null })}
                  className="accent-primary size-4 cursor-pointer"
                />
                {option.value ? (
                  <span className="flex items-center gap-1.5">
                    <Star className="fill-warning text-warning size-3.5" aria-hidden />
                    {option.label}
                  </span>
                ) : (
                  option.label
                )}
              </label>
            ))}
          </div>
        </section>

        {/* Limpia filtros Y búsqueda, pero conserva el orden elegido: ordenar no
            es filtrar, y perderlo al limpiar sorprende. */}
        <button
          type="button"
          onClick={() => {
            clearTimeout(searchTimer.current);
            setSearch("");
            const orden = new URLSearchParams(queryRef.current).get("orden");
            navigate(orden ? new URLSearchParams({ orden }).toString() : "");
          }}
          className="text-text-secondary hover:text-text hover:bg-surface-elevated flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150"
        >
          <RotateCcw className="size-4" aria-hidden />
          Limpiar filtros
        </button>
      </div>
    </aside>
  );
}
