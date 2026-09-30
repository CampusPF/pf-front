import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { CARD } from "@/components/admin/admin-ui";
import type { PeriodMetric } from "@/services/admin/admin-stats.service";

import { formatPercent } from "./format";

/* KPI del período con su comparación contra el período anterior.

   Un número solo ("130 inscripciones") no dice si está bien o mal; el delta
   es lo que lo vuelve una métrica. El delta se muestra en valor ABSOLUTO
   siempre ("+12") y en porcentaje sólo si hay base: contra un período
   anterior en cero, un "+∞ %" no significa nada.

   La dirección nunca va sólo en el color: flecha + signo + texto oculto para
   lectores de pantalla. */

export default function StatTile({
  label,
  icon: Icon,
  metric,
  format,
  comparisonLabel,
  hint,
  sparkline,
}: {
  label: string;
  icon: LucideIcon;
  metric: PeriodMetric;
  format: (value: number) => string;
  /** "vs. 30 días anteriores" */
  comparisonLabel: string;
  hint?: string;
  /** Serie del período para el mini gráfico (opcional). */
  sparkline?: number[];
}) {
  const diff = metric.current - metric.previous;

  return (
    <div className={`${CARD} flex min-w-0 flex-col`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-text-muted text-xs font-medium">{label}</p>
        <Icon className="text-primary size-4 shrink-0" aria-hidden />
      </div>

      <p className="text-text mt-2 text-2xl font-bold tabular-nums">{format(metric.current)}</p>

      <Delta diff={diff} previous={metric.previous} format={format} comparisonLabel={comparisonLabel} />

      {sparkline && sparkline.length > 1 && <Sparkline values={sparkline} />}

      {hint && <p className="text-text-muted mt-auto pt-2 text-[11px]">{hint}</p>}
    </div>
  );
}

function Delta({
  diff,
  previous,
  format,
  comparisonLabel,
}: {
  diff: number;
  previous: number;
  format: (value: number) => string;
  comparisonLabel: string;
}) {
  if (diff === 0) {
    return (
      <p className="text-text-muted mt-1 flex items-start gap-1 text-xs">
        <Minus className="mt-px size-3.5 shrink-0" aria-hidden />
        <span>Sin cambios {comparisonLabel}</span>
      </p>
    );
  }

  const up = diff > 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  const sign = up ? "+" : "−";
  const percent = previous > 0 ? ` (${sign}${formatPercent(Math.abs(diff) / previous)})` : "";

  return (
    <p className={`mt-1 flex items-start gap-1 text-xs ${up ? "text-success-text" : "text-danger"}`}>
      <Arrow className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
        <span className="sr-only">{up ? "Subió " : "Bajó "}</span>
        <span className="font-semibold tabular-nums">
          {sign}
          {format(Math.abs(diff))}
          {percent}
        </span>{" "}
        <span className="text-text-muted">{comparisonLabel}</span>
      </span>
    </p>
  );
}

/** Mini línea de tendencia, decorativa (el número y el delta ya la cuentan). */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const step = 100 / (values.length - 1);
  // 1px de margen arriba y abajo para que el trazo no se corte.
  const points = values.map((value, index) => `${index * step},${23 - (value / max) * 22}`).join(" ");

  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className="text-chart-1 mt-3 h-6 w-full"
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
