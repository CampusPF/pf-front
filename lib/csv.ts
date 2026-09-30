/* Exportación a CSV pensada para abrirse en Excel en español.

   - Separador `;`: con configuración regional es-AR, Excel usa la coma como
     separador decimal y espera `;` entre columnas. Con `,` abriría todo en
     una sola columna.
   - BOM UTF-8 al principio: sin él, Excel lee el archivo como ANSI y las
     tildes y eñes salen rotas ("MarÃ­a").
   - Inyección de fórmulas: una celda que empieza con = + - @ (o tab/CR) la
     ejecuta Excel como fórmula. Los nombres los escriben los usuarios, así
     que un comprador llamado `=HYPERLINK(...)` podría ejecutar algo en la
     compu de quien abre el reporte. Se neutraliza anteponiendo una comilla
     simple, que es lo que recomienda OWASP. */

const SEPARATOR = ";";
const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  // Comillas, separador o saltos de línea obligan a encerrar la celda.
  if (/[";\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(SEPARATOR)).join("\r\n");
}

/** Descarga el CSV en el navegador. */
export function downloadCsv(fileName: string, header: string[], rows: (string | number)[][]): void {
  const blob = new Blob(["﻿", toCsv(header, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Después del click: revocar antes cancelaría la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Monto en centavos → "1234,50" (número que Excel es-AR reconoce como tal). */
export function csvAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
