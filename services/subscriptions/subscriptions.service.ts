import { apiFetch } from "@/services/api-client";

/* Suscripciones del usuario logueado.

   El alta NO se hace por acá: contratar un plan pasa por Stripe
   (POST /payments/create-intent) y la suscripción la activa el webhook
   `payment_intent.succeeded`. El back sólo expone consulta y baja. */

export type SubscriptionPlan = "free" | "premium";
export type SubscriptionStatus = "active" | "cancelled" | "expired";

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  /** Llega como string: el driver de Postgres serializa `numeric` así. */
  lastPaymentAmount?: string | number;
  createdAt?: string;
}

/**
 * `GET /subscriptions/me` — devuelve TODAS las suscripciones (activas,
 * canceladas y vencidas), ordenadas por fecha de creación descendente.
 * Filtrar por `status === "active"` es responsabilidad de quien llama.
 */
export function getMySubscriptions(signal?: AbortSignal) {
  return apiFetch<Subscription[]>("/subscriptions/me", { auth: true, signal });
}

/** `PATCH /subscriptions/:id/cancel` — el back valida que sea tuya. */
export function cancelSubscription(id: string) {
  return apiFetch<Subscription>(
    `/subscriptions/${encodeURIComponent(id)}/cancel`,
    { method: "PATCH", auth: true },
  );
}

/**
 * ¿Esta suscripción da acceso Premium AHORA MISMO? No es sólo
 * `status === "active"`: una `"cancelled"` sigue dando acceso hasta
 * `endDate` — cancelar apaga la renovación, no el período ya pagado (mismo
 * criterio que `SubscriptionsService.hasActiveSubscription` en pf-back, que
 * es quien de verdad lo hace cumplir; si cambia uno, cambia el otro).
 *
 * Es LA regla: la usan `findActiveSubscription` (mi propia suscripción),
 * `dashboard.view.ts` (badge PRO), `checkout.service.ts` (no ofrecer pagar
 * de nuevo) y `admin/admin.service.ts` (métrica de suscripciones activas).
 */
export function isSubscriptionCurrentlyActive(status: SubscriptionStatus, endDate: string): boolean {
  return (status === "active" || status === "cancelled") && new Date(endDate).getTime() > Date.now();
}

/** Mi suscripción vigente, o `null`. Es lo que decide el badge PRO de esta pantalla. */
export function findActiveSubscription(
  subscriptions: Subscription[],
): Subscription | null {
  return subscriptions.find((item) => isSubscriptionCurrentlyActive(item.status, item.endDate)) ?? null;
}
