"use client";

import { useId, useState } from "react";
import { BarChart3, Table2 } from "lucide-react";

import { CARD } from "@/components/admin/admin-ui";

/* Tarjeta de un gráfico, con su salida accesible.

   Un lector de pantalla no puede leer un SVG de puntos, así que cada gráfico
   trae dos cosas: un resumen en texto (`summary`, el aria-label de la figura:
   lo que el gráfico "dice") y la tabla con los mismos datos, a un click. La
   tabla también sirve para quien quiere el número exacto. */

export interface ChartTable {
  columns: { header: string; align?: "left" | "right" }[];
  rows: string[][];
}

export default function ChartCard({
  title,
  description,
  summary,
  table,
  empty,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  /** Qué muestra el gráfico, en una o dos oraciones. */
  summary: string;
  table: ChartTable;
  /** Si viene, se muestra este texto en lugar de un gráfico vacío. */
  empty?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelId = useId();
  const [showTable, setShowTable] = useState(false);

  return (
    <section aria-labelledby={titleId} className={`${CARD} flex min-w-0 flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={titleId} className="text-text font-semibold">
            {title}
          </h3>
          {description && <p className="text-text-muted mt-0.5 text-xs">{description}</p>}
        </div>
        {!empty && (
          <button
            type="button"
            onClick={() => setShowTable((value) => !value)}
            aria-expanded={showTable}
            aria-controls={panelId}
            className="text-text-muted hover:text-text hover:bg-surface-elevated inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
          >
            {showTable ? (
              <>
                <BarChart3 className="size-3.5" aria-hidden /> Ver gráfico
              </>
            ) : (
              <>
                <Table2 className="size-3.5" aria-hidden /> Ver datos
              </>
            )}
          </button>
        )}
      </div>

      <div id={panelId} className="mt-4 min-w-0 flex-1">
        {empty ? (
          <p className="text-text-muted flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-border px-4 text-center text-sm">
            {empty}
          </p>
        ) : showTable ? (
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{title}</caption>
              <thead className="bg-surface sticky top-0">
                <tr className="border-border border-b">
                  {table.columns.map((column) => (
                    <th
                      key={column.header}
                      scope="col"
                      className={`text-text-muted py-2 text-xs font-medium ${
                        column.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {table.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`text-text py-1.5 ${
                          table.columns[cellIndex]?.align === "right" ? "text-right tabular-nums" : ""
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <figure role="img" aria-label={summary} className="m-0">
            {children}
          </figure>
        )}
      </div>
    </section>
  );
}
