"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import type { CategoryOption } from "@/services/courses/courses.types";
import { LEVEL_OPTIONS } from "@/services/courses/courses.service";

/* Los filtros viven en la URL (?q=&nivel=&categoria=&precio=): el filtro es
   linkeable, sobrevive a recargar y la página los lee en el server.

   TODO(back): el filtro de duración se sacó — el listado del back no trae
   las lecciones, así que no hay duración para filtrar. */

const PRICES = [
  { value: "", label: "Todos" },
  { value: "free", label: "Gratis" },
  { value: "premium", label: "Premium" },
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

  const levels = readList(searchParams.get("nivel"));
  const selectedCategories = readList(searchParams.get("categoria"));
  const price = searchParams.get("precio") ?? "";
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  // En mobile el panel arranca cerrado y se despliega con el botón "Filtrar".
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = levels.length + selectedCategories.length + (price ? 1 : 0);

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Cambiar un filtro vuelve a la primera página.
    params.delete("pagina");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggleIn(key: string, list: string[], value: string) {
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    update({ [key]: next.join(",") || null });
  }

  return (
    <aside className="shrink-0 lg:w-60">
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
            update({ q: search.trim() || null });
          }}
        >
          <Search
            className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.replace(pathname, { scroll: false });
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
