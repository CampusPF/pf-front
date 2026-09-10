"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MessagesSquare,
  Monitor,
  Smile,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";

import { getStripe } from "@/lib/stripe";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { formatPrice, type CheckoutInput } from "@/types/checkout";

/* Este checkout se ve siempre oscuro (no sigue el toggle light/dark del
   sitio) a propósito — es la superficie de diseño que pidió el mockup. Por
   eso Stripe Elements va con un Appearance dark fijo en vez de
   useStripeAppearance(), que lee los tokens del tema activo. */
const CHECKOUT_STRIPE_APPEARANCE: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#6366F1",
    colorBackground: "#0F0F1A",
    colorText: "#E7E7EA",
    colorTextSecondary: "#9A9AAB",
    colorDanger: "#F87171",
    fontFamily:
      "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #2A2A3C",
      backgroundColor: "#0F0F1A",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #6366F1",
      boxShadow: "0 0 0 1px #6366F1",
    },
    ".Label": { color: "#9A9AAB", fontSize: "14px" },
    ".Tab": { border: "1px solid #2A2A3C", backgroundColor: "#15151F" },
    ".Tab--selected": { borderColor: "#6366F1", backgroundColor: "#1C1C2E" },
  },
};

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
  const isCourse = checkout.mode === "course";

  const title = isCourse ? "Finalizar inscripción" : "Suscribirme";
  const subtitle = isCourse
    ? "Estás a un paso de sumar este curso a tu biblioteca, con acceso de por vida y sin vencimiento."
    : "Estás a un paso de desbloquear tu potencial como desarrollador con proyectos del mundo real y soporte de élite.";

  const price = isCourse ? checkout.course.priceInCents : checkout.plan.priceInCents;
  const currency = isCourse ? checkout.course.currency : checkout.plan.currency;
  const submitLabel = isCourse
    ? `Confirmar inscripción — ${formatPrice(price, currency)}`
    : `Suscribirme — ${formatPrice(price, currency)} / mes`;

  // La pantalla de éxito necesita saber QUÉ confirmar contra el back
  // (GET /course-enrollments/me o /subscriptions/me) — Stripe redirige a
  // returnUrl agregando sus propios params (payment_intent, etc.), así que
  // estos viajan igual.
  const successParams: Record<string, string> = isCourse
    ? { type: "course", courseId: checkout.course.id }
    : { type: "subscription" };

  const backHref = isCourse ? "/courses" : "/#precios";
  const backLabel = isCourse ? "Volver a cursos" : "Volver a planes";

  return (
    <div className="min-h-screen bg-[#0B0B14] text-[#E7E7EA]">
      <div className="mx-auto max-w-6xl px-6 pt-24">
        {/* Barra de confianza */}
        <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 text-xs">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-[#8A8A99] transition-colors duration-150 hover:text-white"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {backLabel}
          </Link>
          <span className="flex items-center gap-2 font-medium text-[#22C55E]">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#22C55E]" />
            </span>
            Pasarela encriptada TLS 1.3
          </span>
        </div>

        {/* Header */}
        <header className="pt-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#A5B4FC]">
            <Zap className="size-3.5" aria-hidden />
            Checkout seguro
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#9A9AAB]">
            {subtitle}
          </p>
        </header>

        {/* Dos columnas */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div className="checkout-rise">
            <OrderSummary checkout={checkout} />
          </div>

          <div className="checkout-rise checkout-rise-2">
            {clientSecret ? (
              <Elements
                stripe={getStripe()}
                options={{ clientSecret, appearance: CHECKOUT_STRIPE_APPEARANCE }}
              >
                <PaymentForm
                returnUrl={returnUrl}
                successParams={successParams}
                submitLabel={submitLabel}
              />
              </Elements>
            ) : (
              <PaymentPanelPlaceholder />
            )}
          </div>
        </div>

        <CheckoutStats />

        <div className="pb-20" />
      </div>
    </div>
  );
}

/**
 * Se muestra mientras no exista un clientSecret real (por ejemplo, el
 * backend todavía no expone el endpoint que crea el PaymentIntent).
 * Mantiene el marco visual de "Datos de pago" sin el formulario de Stripe.
 */
function PaymentPanelPlaceholder() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1C1C2E] p-6">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-[#6366F1] to-[#22C55E]"
      />
      <h2 className="text-base font-semibold text-white">Datos de pago</h2>
      <p className="mt-3 text-sm text-[#9A9AAB]">
        El formulario de tarjeta va a aparecer acá una vez que el backend
        entregue el{" "}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-[#A5B4FC]">
          clientSecret
        </code>{" "}
        del pago.
      </p>
    </div>
  );
}

const CHECKOUT_STATS: {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}[] = [
  { icon: Monitor, value: "+45.000", label: "Estudiantes activos", color: "text-[#22C55E]" },
  { icon: Smile, value: "98.4%", label: "Índice de satisfacción", color: "text-[#22C55E]" },
  { icon: Zap, value: "120+", label: "Proyectos de producción", color: "text-[#F97316]" },
  { icon: MessagesSquare, value: "< 15 min", label: "Respuesta a dudas de código", color: "text-[#6366F1]" },
];

function CheckoutStats() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/5 pt-8 lg:grid-cols-4">
      {CHECKOUT_STATS.map(({ icon: Icon, value, label, color }) => (
        <div key={label} className="rounded-xl bg-white/2 px-5 py-5 text-center">
          <Icon className={`mx-auto size-5 ${color}`} aria-hidden />
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-[#8A8A99]">{label}</p>
        </div>
      ))}
    </div>
  );
}
