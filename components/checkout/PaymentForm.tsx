"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
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
  /**
   * Query params que la pantalla de éxito necesita para saber QUÉ confirmar
   * (curso o suscripción, y de cuál) — Stripe agrega los suyos propios
   * (payment_intent, redirect_status) al mismo return_url, no lo pisa.
   */
  successParams?: Record<string, string>;
  /** Texto del botón, ya con el precio ("Suscribirme — US$ 19,00 / mes"). */
  submitLabel: string;
}

const PAYMENT_BRANDS = ["Visa", "Mastercard", "Amex"];

export function PaymentForm({ returnUrl, successParams, submitLabel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!stripe || !elements || !acceptedTerms) {
      // Stripe.js todavía no cargó o falta aceptar los términos: el botón
      // debería estar deshabilitado en este caso.
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Se calcula acá, dentro del handler de un click real del usuario,
    // así que siempre corre en el navegador. Nunca durante el render.
    const url = new URL(returnUrl ?? "/checkout/success", window.location.origin);
    if (successParams) {
      for (const [key, value] of Object.entries(successParams)) {
        url.searchParams.set(key, value);
      }
    }
    const finalReturnUrl = url.toString();

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
      className="relative overflow-hidden rounded-2xl bg-[#1C1C2E] p-6"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-[#6366F1] to-[#22C55E]"
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Datos de pago</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#22C55E]">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
            Transacción cifrada y protegida por protocolos bancarios
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] text-[#9A9AAB]">
          <CreditCard className="size-3.5" aria-hidden />
          Stripe
        </span>
      </div>

      {/* Stripe Elements se encarga del selector de método y de los campos
          de tarjeta / documento — no los replicamos a mano. */}
      <div className="mt-5">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl bg-[#F87171]/10 px-4 py-3 text-sm text-[#F87171]">
          {errorMessage}
        </div>
      )}

      <label className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-[#9A9AAB]">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-[#0F0F1A] accent-[#6366F1]"
        />
        <span>
          Acepto los{" "}
          <a href="#" className="text-[#A5B4FC] hover:underline">
            Términos del Servicio
          </a>
          , la{" "}
          <a href="#" className="text-[#A5B4FC] hover:underline">
            Política de Privacidad
          </a>{" "}
          y autorizo la facturación recurrente mensual cancelable en cualquier
          momento.
        </span>
      </label>

      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting || !acceptedTerms}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-3.5 text-sm font-semibold text-white transition duration-150 hover:scale-[1.01] hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Procesando…
          </>
        ) : (
          <>
            <Lock className="size-4" aria-hidden />
            {submitLabel}
            <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-wider text-[#6B6B7B]">
        {PAYMENT_BRANDS.map((brand) => (
          <span key={brand} className="flex items-center gap-2">
            {brand}
            <span aria-hidden>·</span>
          </span>
        ))}
        <span className="flex items-center gap-1">
          <Check className="size-3" aria-hidden />
          PCI DSS Compliant
        </span>
      </div>

      <p className="mt-3 text-center text-[11px] text-[#8A8A99]">
        Tus datos viajan encriptados de extremo a extremo y nunca almacenamos el
        código de seguridad.
      </p>
    </form>
  );
}
