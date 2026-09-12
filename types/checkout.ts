/**
 * Tipos compartidos por los componentes de checkout.
 * Dos modelos de compra: curso individual (acceso de por vida) o
 * suscripción (acceso a todo el catálogo mientras esté activa).
 * Ajustá estos campos a como venga realmente desde tu API.
 */

export interface Course {
  id: string;
  title: string;
  instructor: string;
  /** Portada del curso. `null` si todavía no tiene: se muestra un placeholder. */
  thumbnailUrl: string | null;
  /** Precio en la unidad menor de la moneda (ej: 1999 = $19.99) para evitar errores de floats */
  priceInCents: number;
  currency: string; // "usd", "ars", etc.
}

export interface SubscriptionPlan {
  id: string;
  name: string; // "Plan Mensual", "Plan Anual"
  description: string; // "Acceso a todo el catálogo"
  priceInCents: number;
  currency: string;
  interval: "month" | "year";
  /** Precio de lista antes de la promo, para tacharlo. Opcional. */
  originalPriceInCents?: number;
  /** Etiqueta del descuento aplicado, ej. "Descuento de bienvenida (-35%)". */
  discountLabel?: string;
  /** Bullets de lo que incluye el plan (columna de resumen del checkout). */
  features?: string[];
}

export type CheckoutInput =
  | { mode: "course"; course: Course }
  | { mode: "subscription"; plan: SubscriptionPlan };

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

