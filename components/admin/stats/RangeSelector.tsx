"use client";

import { useId } from "react";

import { STATS_RANGES, type StatsRange } from "@/services/admin/admin-stats.service";

const LABELS: Record<StatsRange, string> = {
  7: "7 días",
  30: "30 días",
  90: "90 días",
  365: "1 año",
};

/* Selector de período del panel: afecta a TODAS las métricas a la vez.

   Radios nativos con apariencia de control segmentado: las flechas del
   teclado, el foco y el anuncio "1 de 4, seleccionado" vienen gratis, sin
   reimplementar un radiogroup a mano. */
export default function RangeSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: StatsRange;
  onChange: (value: StatsRange) => void;
  disabled?: boolean;
}) {
  const name = useId();

  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="sr-only">Período de las métricas</legend>
      <div className="border-border bg-surface inline-flex rounded-lg border p-0.5 shadow-sm">
        {STATS_RANGES.map((range) => (
          <label key={range} className="relative">
            <input
              type="radio"
              name={name}
              value={range}
              checked={value === range}
              onChange={() => onChange(range)}
              className="peer sr-only"
            />
            <span className="text-text-muted hover:text-text peer-checked:bg-primary-subtle peer-checked:text-primary peer-focus-visible:ring-primary block cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors peer-focus-visible:ring-2 peer-disabled:cursor-wait">
              {LABELS[range]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
