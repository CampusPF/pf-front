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
 * POST /payments/create-intent — todavía no existe del lado del back (ver
 * el TODO en app/(marketing)/checkout/page.tsx). Devuelve `null` en vez de
 * tirar mientras no esté disponible: CheckoutPage ya sabe mostrar el
 * placeholder de "todavía no disponible" cuando clientSecret es null, así
 * que el checkout se degrada en vez de romper.
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
    // 404 esperado hasta que el back tenga el endpoint. Cualquier otro
    // error (401, 500) también se degrada acá — el checkout no es el lugar
    // para mostrar un error críptico de red, el placeholder ya comunica
    // "esto todavía no está listo".
    if (!(error instanceof ApiError) || error.status !== 404) {
      console.error("No se pudo crear el intento de pago:", error);
    }
    return null;
  }
}
