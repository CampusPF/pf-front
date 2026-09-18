import { apiFetch } from "@/services/api-client";

/* Lecturas de pagos: el historial del alumno y el reporte de ventas del
   docente/admin. El alta de un pago no pasa por acá — eso es Stripe
   (services/checkout.service.ts) y la fila la crea el back.

   Para formatear los montos se usa `formatPrice` de @/types/checkout, que ya
   existía y hace exactamente esto (centavos → "US$ 49,99"): no hace falta un
   formatMoney nuevo. */

/** Estado del pago tal como lo devuelve el back (enum PaymentStatus). */
export type PaymentStatus = "pending" | "succeeded" | "failed";

/** Fila de `GET /payments/me`. */
export interface MyPayment {
  id: string;
  /** Título del curso comprado, o "Suscripción Premium". */
  concept: string;
  /** En centavos: se formatea con formatPrice, nunca se muestra crudo. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  date: string;
}

/** Fila de `GET /teacher/payments`. */
export interface TeacherPayment {
  id: string;
  courseName: string;
  buyerName: string;
  amount: number;
  currency: string;
  date: string;
}

/**
 * `GET /payments/me` — mis pagos, del más nuevo al más viejo.
 *
 * Incluye los tres estados (pending/succeeded/failed): al alumno le sirve
 * saber si algo quedó a medias, no sólo lo que se cobró.
 */
export function getMyPayments(signal?: AbortSignal): Promise<MyPayment[]> {
  return apiFetch<MyPayment[]>("/payments/me", { auth: true, signal });
}

/**
 * `GET /teacher/payments` — ventas de cursos.
 *
 * El back decide el alcance según el rol del token: un docente ve sólo las
 * ventas de SUS cursos, un admin las de toda la plataforma. Sólo trae pagos
 * confirmados, y nunca suscripciones (esa plata es de la plataforma).
 * Responde 403 para un alumno.
 */
export function getTeacherPayments(signal?: AbortSignal): Promise<TeacherPayment[]> {
  return apiFetch<TeacherPayment[]>("/teacher/payments", { auth: true, signal });
}

/** Suma de una lista de pagos, para el total de la pantalla de ventas. */
export function sumAmounts(payments: { amount: number }[]): number {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}
