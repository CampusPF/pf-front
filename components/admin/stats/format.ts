/* Formatos del panel de métricas, todos en es-AR.

   Las fechas del back vienen como `YYYY-MM-DD` / `YYYY-MM` en hora LOCAL del
   negocio. Se arman con `new Date(año, mes, día)` y no con `new Date("2026-09-12")`,
   que JS interpreta en UTC: en Argentina (UTC-3) eso mostraría el 11. */

function parseDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseMonth(value: string): Date {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

/** "12 sep" */
export function formatDayShort(value: string): string {
  return parseDay(value)
    .toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    .replace(".", "");
}

/** "12 de septiembre" */
export function formatDayLong(value: string): string {
  return parseDay(value).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

/** "sep" (o "sep 25" si `withYear`) */
export function formatMonthShort(value: string, withYear = false): string {
  const label = parseMonth(value)
    .toLocaleDateString("es-AR", { month: "short", ...(withYear ? { year: "2-digit" } : {}) })
    .replace(".", "");
  return label;
}

/** "septiembre de 2026" */
export function formatMonthLong(value: string): string {
  return parseMonth(value).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

const integer = new Intl.NumberFormat("es-AR");

export function formatInt(value: number): string {
  return integer.format(value);
}

/** "US$ 1.234,50" */
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** "US$ 1,2 mil" — para ejes, donde no entra el número completo. */
export function formatMoneyCompact(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

/** "33 %" */
export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 0 }).format(ratio);
}

/** "últimos 30 días" / "último año" */
export function rangeLabel(days: number): string {
  return days === 365 ? "último año" : `últimos ${days} días`;
}
