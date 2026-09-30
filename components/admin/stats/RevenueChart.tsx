"use client";

import { useCallback } from "react";

import type { AdminStats } from "@/services/admin/admin-stats.service";

import ApexChart, { baseOptions, pointIndex, type ChartPalette } from "./ApexChart";
import ChartCard from "./ChartCard";
import { formatMoney, formatMoneyCompact, formatMonthLong, formatMonthShort } from "./format";

const HEIGHT = 260;

/* Ingresos cobrados por mes, últimos 12 meses (no depende del selector de
   período: un gráfico mensual de 7 días no tiene sentido).

   Admin: columnas apiladas cursos + suscripciones, con leyenda (dos series
   nunca van sin leyenda). Docente: sólo sus ventas de cursos, una serie. */
export default function RevenueChart({ stats, className }: { stats: AdminStats; className?: string }) {
  const months = stats.revenueByMonth;
  const currency = stats.currency;
  const isPlatform = stats.scope === "platform";
  const money = (cents: number) => formatMoney(cents, currency);

  const totals = months.map((m) => m.courseCents + m.subscriptionCents);
  const total = totals.reduce((sum, value) => sum + value, 0);
  const bestIndex = totals.indexOf(Math.max(...totals));

  const build = useCallback(
    (palette: ChartPalette) => {
      const base = baseOptions(palette, HEIGHT);
      // En celular, 12 meses no entran: se rotula uno de cada tres, contando
      // desde el último (el mes actual siempre queda rotulado).
      const last = months.length - 1;
      const labeled = new Set(
        months.filter((_, i) => !palette.compact || (last - i) % 3 === 0).map((m) => m.month),
      );
      const series = isPlatform
        ? [
            { name: "Cursos", data: months.map((m) => m.courseCents) },
            { name: "Suscripciones", data: months.map((m) => m.subscriptionCents) },
          ]
        : [{ name: "Ventas de cursos", data: months.map((m) => m.courseCents) }];

      return {
        ...base,
        chart: { ...base.chart, type: "bar" as const, stacked: isPlatform },
        series,
        colors: [palette.series1, palette.series2],
        plotOptions: {
          bar: {
            columnWidth: "55%",
            borderRadius: 4,
            borderRadiusApplication: "end" as const,
            borderRadiusWhenStacked: "last" as const,
          },
        },
        // Separación de 2px del color de la superficie entre segmentos
        // apilados: cada tramo se lee como un bloque propio.
        stroke: { show: true, width: 2, colors: [palette.surface] },
        legend: {
          show: isPlatform,
          position: "top" as const,
          horizontalAlign: "left" as const,
          fontSize: "12px",
          labels: { colors: palette.text },
          markers: { size: 5, shape: "circle" as const },
          itemMargin: { horizontal: 10 },
        },
        xaxis: {
          categories: months.map((m) => m.month),
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: {
            rotate: 0,
            hideOverlappingLabels: true,
            formatter: (value: string) => (value && labeled.has(value) ? formatMonthShort(value) : ""),
          },
          tooltip: { enabled: false },
        },
        yaxis: {
          min: 0,
          forceNiceScale: true,
          labels: { formatter: (value: number) => formatMoneyCompact(value, currency) },
        },
        tooltip: {
          ...base.tooltip,
          shared: true,
          intersect: false,
          x: { formatter: (_: string | number, opts?: { dataPointIndex?: number }) => formatMonthLong(months[pointIndex(opts)].month) },
          y: { formatter: (value: number) => formatMoney(value, currency) },
        },
      };
    },
    [months, currency, isPlatform],
  );

  const summary =
    total === 0
      ? "Sin ingresos cobrados en los últimos 12 meses."
      : `Ingresos cobrados en los últimos 12 meses: ${money(total)}. ` +
        `El mes más alto fue ${formatMonthLong(months[bestIndex].month)}, con ${money(totals[bestIndex])}.`;

  return (
    <ChartCard
      className={className}
      title={isPlatform ? "Ingresos por mes" : "Mis ventas por mes"}
      description={`${money(total)} en los últimos 12 meses`}
      summary={summary}
      empty={total === 0 ? "Todavía no hay pagos cobrados en los últimos 12 meses." : null}
      table={{
        columns: isPlatform
          ? [
              { header: "Mes" },
              { header: "Cursos", align: "right" },
              { header: "Suscripciones", align: "right" },
              { header: "Total", align: "right" },
            ]
          : [{ header: "Mes" }, { header: "Ventas", align: "right" }],
        rows: [...months].reverse().map((m) =>
          isPlatform
            ? [
                formatMonthLong(m.month),
                money(m.courseCents),
                money(m.subscriptionCents),
                money(m.courseCents + m.subscriptionCents),
              ]
            : [formatMonthLong(m.month), money(m.courseCents)],
        ),
      }}
    >
      <ApexChart build={build} height={HEIGHT} />
    </ChartCard>
  );
}
