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
 * POST /payments/create-intent — ya existe del lado del back. Igual
 * devuelve `null` (en vez de tirar) ante cualquier error: el checkout no
 * es el lugar para mostrar un error críptico de red, el placeholder de
 * CheckoutPage ("todavía no disponible") ya comunica que algo no está
 * listo — típicamente que falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY o que
 * el curso/plan no es válido.
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentResponse | null> {
  try {
    return await apiFetch<PaymentIntentResponse>("/payments/create-intent", {
      method: "POST",
      body: input,
      auth: true,
    });
  } catch (error) {
    console.error("No se pudo crear el intento de pago:", error);
    return null;
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
