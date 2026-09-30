"use client";

import { useCallback } from "react";

import type { AdminStats } from "@/services/admin/admin-stats.service";

import ApexChart, { baseOptions, pointIndex, type ChartPalette } from "./ApexChart";
import ChartCard from "./ChartCard";
import { formatInt, rangeLabel } from "./format";

const BAR_ROW = 44;
const MAX_LABEL = 26;

const truncate = (text: string) => (text.length > MAX_LABEL ? `${text.slice(0, MAX_LABEL - 1)}…` : text);

/** Eje con números redondos (0, 20, 40, 60) y aire para el número de la
 *  barra más larga: un 20 % más que el máximo, redondeado a un paso "lindo". */
function niceAxis(maxValue: number): { max: number; ticks: number } {
  const target = (maxValue * 1.2) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(target, 1)));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= target) ?? 10 * magnitude;
  const roundStep = Math.max(1, Math.ceil(step));
  const max = Math.ceil((maxValue * 1.2) / roundStep) * roundStep;
  return { max, ticks: max / roundStep };
}

/* Top 5 de cursos por inscripciones en el período.

   Barras HORIZONTALES porque los títulos de curso son largos: en columnas
   quedarían rotados e ilegibles. Un solo color: acá importa la magnitud, no
   distinguir un curso de otro. El número va al final de cada barra (son
   cinco: se puede etiquetar todo sin ensuciar). */
export default function TopCoursesChart({ stats, className }: { stats: AdminStats; className?: string }) {
  const courses = stats.topCourses;
  // Alto mínimo de 3 filas: con 1 o 2 cursos el gráfico no queda aplastado.
  const height = Math.max(courses.length, 3) * BAR_ROW + 32;
  // Mismo grosor de barra aunque haya menos cursos que filas reservadas.
  const barHeight = `${Math.round((60 * Math.min(courses.length, 3)) / 3)}%`;
  const { max: axisMax, ticks: axisTicks } = niceAxis(Math.max(...courses.map((c) => c.enrollments), 1));

  const build = useCallback(
    (palette: ChartPalette) => {
      const base = baseOptions(palette, height);
      return {
        ...base,
        chart: { ...base.chart, type: "bar" as const },
        series: [{ name: "Inscripciones", data: courses.map((c) => c.enrollments) }],
        colors: [palette.series1],
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight,
            borderRadius: 4,
            borderRadiusApplication: "end" as const,
            dataLabels: { position: "top" },
          },
        },
        dataLabels: {
          enabled: true,
          offsetX: 22,
          // El número usa el color de TEXTO, no el de la serie.
          style: { colors: [palette.text], fontSize: "12px", fontWeight: 600 },
          formatter: (value: number) => formatInt(value),
        },
        grid: {
          ...base.grid,
          // En barras horizontales la magnitud corre en X: la grilla va vertical.
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: false } },
          padding: { left: 4, right: 28 },
        },
        xaxis: {
          categories: courses.map((c) => truncate(c.title)),
          min: 0,
          max: axisMax,
          tickAmount: axisTicks,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: { formatter: (value: string) => formatInt(Math.round(Number(value))) },
        },
        yaxis: {
          labels: { maxWidth: 200, style: { colors: palette.text, fontSize: "12px" } },
        },
        tooltip: {
          ...base.tooltip,
          // En el tooltip el título completo, sin recortar.
          x: { formatter: (_: string | number, opts?: { dataPointIndex?: number }) => courses[pointIndex(opts)].title },
          y: { formatter: (value: number) => formatInt(value), title: { formatter: () => "Inscripciones" } },
        },
      };
    },
    [courses, height, barHeight, axisMax, axisTicks],
  );

  const summary =
    courses.length === 0
      ? `Sin inscripciones en los ${rangeLabel(stats.range.days)}.`
      : `Cursos con más inscripciones en los ${rangeLabel(stats.range.days)}: ` +
        courses.map((c) => `${c.title}, ${formatInt(c.enrollments)}`).join("; ") +
        ".";

  return (
    <ChartCard
      className={className}
      title="Cursos más elegidos"
      description={`Por inscripciones, ${rangeLabel(stats.range.days)}`}
      summary={summary}
      empty={courses.length === 0 ? `No hubo inscripciones en los ${rangeLabel(stats.range.days)}.` : null}
      table={{
        columns: [{ header: "Curso" }, { header: "Inscripciones", align: "right" }],
        rows: courses.map((c) => [c.title, formatInt(c.enrollments)]),
      }}
    >
      <ApexChart build={build} height={height} />
    </ChartCard>
  );
}
