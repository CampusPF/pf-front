"use client";

import { startTransition, useOptimistic } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

import { SORT_OPTIONS } from "@/services/courses/courses.types";

/* Orden del catálogo (?orden=). Vive arriba de la grilla, no en el panel de
   filtros: ordenar no achica los resultados, y es lo que se busca con la
   vista puesta en la grilla.

   Misma mecánica que CourseFilters: navegación dentro de una transición, con
   el valor optimista para que el select cambie en el acto y `data-pending`
   para que la grilla se atenúe (group-has-data-pending en la página). */
export default function CourseSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setOptimisticValue] = useOptimistic(searchParams.get("orden") ?? "");
  const [isPending, setIsPending] = useOptimistic(false);

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("orden", next);
    else params.delete("orden");
    // Cambiar el orden vuelve a la primera página.
    params.delete("pagina");
    const query = params.toString();

    startTransition(() => {
      setOptimisticValue(next);
      setIsPending(true);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <label
      className="text-text-secondary flex items-center gap-2 text-sm"
      data-pending={isPending ? "" : undefined}
    >
      <ArrowUpDown className="size-4" aria-hidden />
      <span className="sr-only sm:not-sr-only">Ordenar por</span>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-surface border-border text-text focus:border-primary focus:ring-primary/30 cursor-pointer rounded-lg border py-1.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value || "recent"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
