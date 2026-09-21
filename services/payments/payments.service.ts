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

/**
 * Separa los intentos de pago sobrantes de los que vale la pena mostrar.
 *
 * El back crea un pago "pending" cada vez que se abre el checkout, aunque
 * después no se complete (recargar la página, volver atrás…). Sin esto, una
 * sola compra deja una fila "Pendiente" por cada visita. Se ocultan los
 * pendientes de un concepto que:
 *  - ya tiene un pago exitoso (esos intentos quedaron obsoletos), o
 *  - tiene otro pendiente más nuevo (sólo importa el último).
 * Los pagos exitosos y los rechazados nunca se ocultan.
 *
 * TODO(back): que reutilice el pago pendiente del mismo curso en vez de crear
 * uno por visita; con eso esta función deja de hacer falta.
 */
export function splitStaleAttempts<T extends Pick<MyPayment, "id" | "concept" | "status" | "date">>(
  payments: T[],
): { visible: T[]; hidden: T[] } {
  const paidConcepts = new Set(
    payments.filter((payment) => payment.status === "succeeded").map((payment) => payment.concept),
  );

  // Del más nuevo al más viejo (no se asume el orden que mande el back).
  const newestFirst = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const pendingSeen = new Set<string>();
  const staleIds = new Set<string>();

  for (const payment of newestFirst) {
    if (payment.status !== "pending") continue;

    if (paidConcepts.has(payment.concept) || pendingSeen.has(payment.concept)) {
      staleIds.add(payment.id);
    } else {
      pendingSeen.add(payment.concept);
    }
  }

  return {
    visible: payments.filter((payment) => !staleIds.has(payment.id)),
    hidden: payments.filter((payment) => staleIds.has(payment.id)),
  };
}

/** Suma de una lista de pagos, para el total de la pantalla de ventas. */
export function sumAmounts(payments: { amount: number }[]): number {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}
