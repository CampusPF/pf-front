"use client";

import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { useStripeAppearance } from "@/hooks/useStripeAppearance";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import type { CheckoutInput } from "@/types/checkout";

interface CheckoutPageProps {
  checkout: CheckoutInput;
  /**
   * Viene de tu backend: POST /payments/create-intent devuelve el
   * client_secret del PaymentIntent (compra de curso) o del primer pago
   * de la suscripción, creado con { courseId } o { planId } — nunca un
   * array de ítems. Mientras no lo tengan conectado, dejalo en `null` y
   * se muestra un estado de espera en vez de romper.
   */
  clientSecret: string | null;
  /**
   * Opcional: a dónde redirigir tras un pago exitoso. Si no se pasa,
   * PaymentForm arma una por defecto con window.location.origin.
   */
  returnUrl?: string;
}

export function CheckoutPage({ checkout, clientSecret, returnUrl }: CheckoutPageProps) {
  const appearance = useStripeAppearance();
  const isCourse = checkout.mode === "course";

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-text">
        {isCourse ? "Finalizar inscripción" : "Suscribirme"}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <OrderSummary checkout={checkout} />

        {clientSecret ? (
          <Elements
            stripe={getStripe()}
            options={{ clientSecret, appearance }}
          >
            <PaymentForm
              returnUrl={returnUrl}
              submitLabel={isCourse ? "Confirmar inscripción" : "Suscribirme ahora"}
            />
          </Elements>
        ) : (
          <PaymentFormPlaceholder />
        )}
      </div>
    </div>
  );
}

/**
 * Se muestra mientras no exista un clientSecret real (por ejemplo, el
 * backend todavía no expone el endpoint que crea el PaymentIntent).
 * Útil para maquetar y revisar el layout sin depender del servidor.
 */
function PaymentFormPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center shadow-sm">
      <h2 className="mb-2 text-base font-semibold text-text">Datos de pago</h2>
      <p className="text-sm text-text-secondary">
        El formulario de tarjeta va a aparecer acá una vez que el backend
        entregue el <code className="rounded-full bg-primary-subtle px-2 py-0.5 text-primary">clientSecret</code> del pago.
      </p>
    </div>
  );
}
