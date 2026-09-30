"use client";

import { useCallback } from "react";

import type { AdminStats } from "@/services/admin/admin-stats.service";

import ApexChart, { baseOptions, pointIndex, type ChartPalette } from "./ApexChart";
import ChartCard from "./ChartCard";
import { formatDayLong, formatDayShort, formatInt, rangeLabel } from "./format";

const HEIGHT = 260;

/* Inscripciones por día: la pregunta "¿esto crece?". Una sola serie, así que
   un solo color (el principal) y sin leyenda: el título ya la nombra. */
export default function EnrollmentsChart({ stats }: { stats: AdminStats }) {
  const days = stats.enrollmentsByDay;
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const peak = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);

  const build = useCallback(
    (palette: ChartPalette) => {
      const base = baseOptions(palette, HEIGHT);
      return {
        ...base,
        chart: { ...base.chart, type: "area" as const },
        series: [{ name: "Inscripciones", data: days.map((day) => day.count) }],
        colors: [palette.series1],
        stroke: { curve: "straight" as const, width: 2 },
        // Relleno liso y tenue: el área acompaña a la línea, no compite.
        fill: { type: "solid", opacity: 0.12 },
        markers: { size: 0, strokeWidth: 2, strokeColors: palette.surface, hover: { size: 5 } },
        xaxis: {
          categories: days.map((day) => day.date),
          tickAmount: Math.min(days.length - 1, palette.compact ? 3 : 6),
          tickPlacement: "on",
          axisBorder: { show: false },
          axisTicks: { show: false },
          crosshairs: { stroke: { color: palette.grid, width: 1, dashArray: 0 } },
          labels: {
            rotate: 0,
            hideOverlappingLabels: true,
            formatter: (value: string) => (value ? formatDayShort(value) : ""),
          },
          tooltip: { enabled: false },
        },
        yaxis: {
          min: 0,
          forceNiceScale: true,
          decimalsInFloat: 0,
          labels: { formatter: (value: number) => formatInt(Math.round(value)) },
        },
        tooltip: {
          ...base.tooltip,
          x: { formatter: (_: string | number, opts?: { dataPointIndex?: number }) => formatDayLong(days[pointIndex(opts)].date) },
          y: { formatter: (value: number) => formatInt(value) },
        },
      };
    },
    [days],
  );

  const summary =
    total === 0
      ? `Sin inscripciones en los ${rangeLabel(stats.range.days)}.`
      : `Inscripciones por día, ${rangeLabel(stats.range.days)}: ${formatInt(total)} en total; ` +
        `el día con más fue el ${formatDayLong(peak.date)}, con ${formatInt(peak.count)}.`;

  return (
    <ChartCard
      title="Inscripciones por día"
      description={`${formatInt(total)} en los ${rangeLabel(stats.range.days)}`}
      summary={summary}
      empty={total === 0 ? `No hubo inscripciones en los ${rangeLabel(stats.range.days)}.` : null}
      table={{
        columns: [{ header: "Día" }, { header: "Inscripciones", align: "right" }],
        rows: [...days].reverse().map((day) => [formatDayLong(day.date), formatInt(day.count)]),
      }}
    >
      <ApexChart build={build} height={HEIGHT} />
    </ChartCard>
  );
}
