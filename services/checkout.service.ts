import { ApiError, apiFetch } from "@/services/api-client";

export interface CreatePaymentIntentInput {
  /** Compra de un curso individual (de por vida). Excluyente con planId. */
  courseId?: string;
  /** Alta/renovación de una suscripción. Excluyente con courseId. */
  planId?: string;
}

export interface PaymentIntentResponse {
  /** client_secret del PaymentIntent de Stripe, para pasarle a <Elements>. */
  clientSecret: string;
}

/**
 * POST /payments/create-intent.
 *
 * TIRA el error (no lo traga): quién llama necesita distinguir un 409 ("ya
 * lo tenés", que no es un error para el usuario) de un 400/500 real, y
 * mostrar el motivo que manda el back. Antes devolvía `null` y el checkout
 * caía en un panel que hablaba de `clientSecret` y del backend — jerga de
 * desarrollo que un comprador no tiene por qué ver.
 *
 * Errores del back: 400 curso gratis o body inválido · 404 curso inexistente
 * · 409 ya inscripto / ya suscripto · 503 Stripe sin configurar.
 */
export function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentResponse> {
  return apiFetch<PaymentIntentResponse>("/payments/create-intent", {
    method: "POST",
    body: input,
    auth: true,
  });
}

/**
 * POST /payments/:intentId/sync — le pide al back que le pregunte a STRIPE
 * si el pago se cobró y, si es así, que active el acceso en el acto.
 *
 * Es el camino principal de activación al volver del checkout. El webhook
 * sigue existiendo como respaldo (cubre al que cierra la pestaña antes de
 * volver), pero no alcanza solo: en desarrollo Stripe no puede llegar a
 * `localhost`, y en producción puede demorarse. Sin este llamado el usuario
 * pagaba y el acceso nunca se activaba.
 *
 * Nunca tira: si falla, el polling de waitForAccessConfirmation sigue
 * esperando al webhook como antes.
 */
export async function syncPayment(paymentIntentId: string): Promise<void> {
  try {
    await apiFetch(`/payments/${encodeURIComponent(paymentIntentId)}/sync`, {
      method: "POST",
      auth: true,
    });
  } catch (error) {
    console.error("No se pudo sincronizar el pago:", error);
  }
}

interface EnrollmentSummary {
  course: { id: string };
}

interface SubscriptionSummary {
  status: string;
}

/** GET /course-enrollments/me ya sólo trae inscripciones activas por
    default (ver course-enrollments.service.ts:findAllByStudent en el
    back), así que sólo hace falta confirmar que el curso esté en la lista. */
async function hasActiveCourseEnrollment(courseId: string): Promise<boolean> {
  const enrollments = await apiFetch<EnrollmentSummary[]>(
    "/course-enrollments/me",
    { auth: true },
  );
  return enrollments.some((enrollment) => enrollment.course.id === courseId);
}

/** GET /subscriptions/me trae TODAS las suscripciones (activas, canceladas,
    vencidas) — acá sí hay que filtrar por status vos mismo. */
async function hasActiveSubscription(): Promise<boolean> {
  const subscriptions = await apiFetch<SubscriptionSummary[]>(
    "/subscriptions/me",
    { auth: true },
  );
  return subscriptions.some((subscription) => subscription.status === "active");
}

export type PendingAccessCheck =
  | { mode: "course"; courseId: string }
  | { mode: "subscription" };

/**
 * Chequeo previo, ANTES de crear un PaymentIntent: si el usuario ya tiene
 * acceso (curso ya comprado, o suscripción ya activa), no tiene sentido
 * dejarlo pagar de nuevo. El back igual lo rechaza con 409 en
 * create-intent (es la defensa real, esto es sólo para no mostrarle a un
 * usuario real el formulario de tarjeta para algo que ya tiene).
 *
 * Ante un error de red acá, se resuelve `false` (no bloquea el checkout
 * por un chequeo que falló) — el 409 del back sigue ahí como respaldo.
 */
export async function hasAccess(check: PendingAccessCheck): Promise<boolean> {
  try {
    return check.mode === "course"
      ? await hasActiveCourseEnrollment(check.courseId)
      : await hasActiveSubscription();
  } catch {
    return false;
  }
}

/**
 * El pago se confirma en el navegador (stripe.confirmPayment) pero el que
 * de verdad activa el curso/la suscripción es el webhook de Stripe,
 * async y en paralelo — cuando el usuario llega a /checkout/success el
 * webhook puede no haber corrido todavía. Se pollea unos segundos antes
 * de darlo por perdido (nunca por errores intermitentes de red: eso corta
 * el polling entero en vez de reintentar).
 */
export async function waitForAccessConfirmation(
  check: PendingAccessCheck,
  { attempts = 6, delayMs = 1500 }: { attempts?: number; delayMs?: number } = {},
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      if (
        check.mode === "course"
          ? await hasActiveCourseEnrollment(check.courseId)
          : await hasActiveSubscription()
      ) {
        return true;
      }
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      // Error de red/servidor puntual: seguimos intentando, no cortamos.
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}
