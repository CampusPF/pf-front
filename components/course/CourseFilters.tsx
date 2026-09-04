"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";

/* TODO(campus): los filtros son sólo visuales. El estado vive acá y no toca la
   grilla todavía; cuando exista el endpoint de catálogo esto pasa a searchParams
   (?nivel=&categoria=…) para que el filtro sea linkeable y renderice en server. */

const LEVELS = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

const CATEGORIES = [
  { value: "web-development", label: "Desarrollo Web" },
  { value: "ai", label: "Inteligencia Artificial" },
  { value: "databases", label: "Bases de Datos" },
  { value: "devops", label: "DevOps" },
];

const PRICES = [
  { value: "all", label: "Todos" },
  { value: "free", label: "Gratis" },
  { value: "premium", label: "Premium" },
];

const DURATIONS = [
  { value: "all", label: "Cualquiera" },
  { value: "short", label: "Menos de 20hs" },
  { value: "long", label: "Más de 20hs" },
];

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-text mb-3 text-sm font-semibold">{children}</h3>
  );
}

export default function CourseFilters() {
  const [levels, setLevels] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [price, setPrice] = useState("all");
  const [duration, setDuration] = useState("all");
  // En mobile el panel arranca cerrado y se despliega con el botón "Filtrar".
  const [isOpen, setIsOpen] = useState(false);

  const activeCount =
    levels.length +
    categories.length +
    (price === "all" ? 0 : 1) +
    (duration === "all" ? 0 : 1);

  function clearAll() {
    setLevels([]);
    setCategories([]);
    setPrice("all");
    setDuration("all");
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
        <p className="text-text-muted mb-5 text-sm font-semibold tracking-wider uppercase">
          Filtrar
        </p>

        <section className="mb-6">
          <SectionTitle>Nivel</SectionTitle>
          <div className="space-y-2.5">
            {LEVELS.map((level) => (
              <label
                key={level.value}
                className="text-text-secondary hover:text-text flex cursor-pointer items-center gap-2.5 text-sm transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  checked={levels.includes(level.value)}
                  onChange={() => setLevels((prev) => toggle(prev, level.value))}
                  className="accent-primary size-4 cursor-pointer rounded"
                />
                {level.label}
              </label>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <SectionTitle>Categoría</SectionTitle>
          <div className="space-y-2.5">
            {CATEGORIES.map((category) => (
              <label
                key={category.value}
                className="text-text-secondary hover:text-text flex cursor-pointer items-center gap-2.5 text-sm transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  checked={categories.includes(category.value)}
                  onChange={() =>
                    setCategories((prev) => toggle(prev, category.value))
                  }
                  className="accent-primary size-4 cursor-pointer rounded"
                />
                {category.label}
              </label>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <SectionTitle>Precio</SectionTitle>
          <div className="space-y-2.5">
            {PRICES.map((option) => (
              <label
                key={option.value}
                className="text-text-secondary hover:text-text flex cursor-pointer items-center gap-2.5 text-sm transition-colors duration-150"
              >
                <input
                  type="radio"
                  name="precio"
                  value={option.value}
                  checked={price === option.value}
                  onChange={() => setPrice(option.value)}
                  className="accent-primary size-4 cursor-pointer"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <SectionTitle>Duración</SectionTitle>
          <div className="space-y-2.5">
            {DURATIONS.map((option) => (
              <label
                key={option.value}
                className="text-text-secondary hover:text-text flex cursor-pointer items-center gap-2.5 text-sm transition-colors duration-150"
              >
                <input
                  type="radio"
                  name="duracion"
                  value={option.value}
                  checked={duration === option.value}
                  onChange={() => setDuration(option.value)}
                  className="accent-primary size-4 cursor-pointer"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={clearAll}
          className="text-text-secondary hover:text-text hover:bg-surface-elevated flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150"
        >
          <RotateCcw className="size-4" aria-hidden />
          Limpiar filtros
        </button>
      </div>
    </aside>
  );
}
