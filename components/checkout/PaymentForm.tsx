"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

interface PaymentFormProps {
  /**
   * A dónde redirigir a Stripe después de un pago exitoso (3D Secure, etc.).
   * Opcional: si no se pasa, se arma con window.location.origin recién al
   * enviar el formulario (nunca durante el render, para evitar problemas
   * de SSR — window no existe en el servidor).
   */
  returnUrl?: string;
  /** Texto del botón, por si quieren personalizarlo ("Pagar $49.99", etc.) */
  submitLabel: string;
}

export function PaymentForm({ returnUrl, submitLabel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js todavía no cargó, el botón debería estar deshabilitado en este caso
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Se calcula acá, dentro del handler de un click real del usuario,
    // así que siempre corre en el navegador. Nunca durante el render.
    const finalReturnUrl = returnUrl ?? `${window.location.origin}/checkout/success`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: finalReturnUrl,
      },
    });

    // Si llegamos acá es porque hubo un error inmediato (tarjeta rechazada, etc.).
    // Si todo sale bien, el navegador redirige a returnUrl y este código no se ejecuta.
    if (error.type === "card_error" || error.type === "validation_error") {
      setErrorMessage(error.message ?? "No pudimos procesar el pago.");
    } else {
      setErrorMessage("Ocurrió un error inesperado. Intentá de nuevo.");
    }

    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-6 shadow-md"
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-success" />
        <h2 className="text-base font-semibold text-text">Datos de pago</h2>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="mt-4 rounded-xl bg-danger-subtle px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Procesando..." : submitLabel}
      </button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted">
        <Lock className="h-3.5 w-3.5" />
        Pago procesado de forma segura por Stripe
      </p>
    </form>
  );
}
