"use client";

import { useEffect, useRef, useState } from "react";
import type ApexCharts from "apexcharts";

import { useTheme } from "@/lib/use-theme";

/* Wrapper mínimo de ApexCharts (paquete base, sin react-apexcharts: ese
   wrapper arrastra peer deps viejas que chocan con React 19).

   - Carga diferida: ApexCharts se importa recién cuando se monta un gráfico,
     así no viaja a ninguna otra pantalla. Se importa `core` + sólo los tipos
     de gráfico que usa el panel, no el paquete entero.
   - Tema: ApexCharts lee los colores UNA vez al dibujar. Al cambiar de tema
     se vuelven a leer los tokens de globals.css y se redibuja; si no, el
     gráfico quedaría con los colores del tema anterior.
   - Accesibilidad: el SVG se oculta a lectores de pantalla. Lo accesible es
     el resumen y la tabla de `ChartCard`, que envuelve a este componente. */

export type ApexOptions = ApexCharts.ApexOptions;

/** Índice del punto en un formatter de tooltip (`opts` puede no venir). */
export const pointIndex = (opts?: { dataPointIndex?: number }) => opts?.dataPointIndex ?? 0;

/** Colores del tema actual, leídos de los tokens CSS. */
export interface ChartPalette {
  series1: string;
  series2: string;
  grid: string;
  label: string;
  text: string;
  surface: string;
  fontFamily: string;
  mode: "light" | "dark";
  /** Contenedor angosto (celular): los ejes muestran menos etiquetas. */
  compact: boolean;
}

/** Por debajo de este ancho de contenedor, los gráficos pasan a modo compacto. */
const COMPACT_WIDTH = 480;

function readPalette(mode: "light" | "dark", compact: boolean): ChartPalette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return {
    series1: token("--color-chart-1"),
    series2: token("--color-chart-2"),
    grid: token("--color-chart-grid"),
    label: token("--color-text-muted"),
    text: token("--color-text"),
    surface: token("--color-surface"),
    fontFamily: getComputedStyle(document.body).fontFamily,
    mode,
    compact,
  };
}

type ApexChartsClass = typeof ApexCharts;
let apexLoader: Promise<ApexChartsClass> | null = null;

/** Una sola descarga por pestaña, compartida por todos los gráficos. */
function loadApexCharts(): Promise<ApexChartsClass> {
  apexLoader ??= (async () => {
    const { default: Apex } = await import("apexcharts/core");
    await Promise.all([
      import("apexcharts/area"),
      import("apexcharts/bar"),
      import("apexcharts/features/legend"),
    ]);
    return Apex;
  })();
  return apexLoader;
}

/** Lo que comparten todos los gráficos del panel: sin barra de herramientas,
 *  sin zoom, sin animaciones largas, grilla sólo horizontal y tipografía y
 *  colores del sistema de diseño. */
export function baseOptions(palette: ChartPalette, height: number): ApexOptions {
  return {
    chart: {
      height,
      fontFamily: palette.fontFamily,
      foreColor: palette.label,
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
      selection: { enabled: false },
      // Redibujar con animación cada vez que cambia el filtro se siente lento.
      animations: { enabled: false },
      parentHeightOffset: 0,
      redrawOnParentResize: true,
    },
    theme: { mode: palette.mode },
    grid: {
      borderColor: palette.grid,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 8, right: 8 },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { theme: palette.mode },
    states: {
      hover: { filter: { type: "darken" } },
      active: { filter: { type: "none" } },
    },
  };
}

export default function ApexChart({
  build,
  height,
}: {
  /** Arma las opciones con los colores del tema. Tiene que ser estable
   *  (useCallback con los datos como dependencias): cada vez que cambia, el
   *  gráfico se redibuja. */
  build: (palette: ChartPalette) => ApexOptions;
  height: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ApexCharts | null>(null);
  const theme = useTheme();
  // `null` hasta medir el contenedor: no se dibuja con un modo que después cambie.
  const [compact, setCompact] = useState<boolean | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < COMPACT_WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // `null` = todavía sin hidratar (tema) o sin medir (ancho).
    if (!theme || compact === null || !containerRef.current) return;

    let cancelled = false;
    const options = build(readPalette(theme, compact));

    loadApexCharts().then((Apex) => {
      if (cancelled || !containerRef.current) return;
      if (chartRef.current) {
        // Mismo gráfico, datos o tema nuevos: se actualiza sin re-montar.
        void chartRef.current.updateOptions(options, true, false);
        return;
      }
      const chart = new Apex(containerRef.current, options);
      chartRef.current = chart;
      void chart.render();
    });

    return () => {
      cancelled = true;
    };
  }, [build, theme, compact]);

  // Al desmontar, liberar listeners y el SVG.
  useEffect(
    () => () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    },
    [],
  );

  // La altura se reserva desde el primer render: sin esto, la página salta
  // cuando termina de cargar ApexCharts.
  return <div ref={containerRef} style={{ minHeight: height }} aria-hidden="true" />;
}
