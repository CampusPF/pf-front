"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";

import { getStripe } from "@/lib/stripe";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { useStripeAppearance } from "@/hooks/useStripeAppearance";
import { formatPrice, type CheckoutInput } from "@/types/checkout";

/* El checkout sigue el tema light/dark como el resto del sitio: todo con
   tokens (bg-bg, bg-surface, text-text…) y Stripe Elements con
   useStripeAppearance(), que resuelve esos mismos tokens y se actualiza
   cuando cambia data-theme (el iframe de Stripe no ve las variables CSS). */

interface CheckoutPageProps {
  checkout: CheckoutInput;
  /**
   * client_secret del PaymentIntent (POST /payments/create-intent). Si no se
   * pudo crear, esta pantalla no se renderiza: el checkout muestra antes un
   * estado de error con el motivo (ver app/(marketing)/checkout/page.tsx).
   */
  clientSecret: string;
  /**
   * Opcional: a dónde redirigir tras un pago exitoso. Si no se pasa,
   * PaymentForm arma una por defecto con window.location.origin.
   */
  returnUrl?: string;
}

export function CheckoutPage({ checkout, clientSecret, returnUrl }: CheckoutPageProps) {
  const isCourse = checkout.mode === "course";
  const stripeAppearance = useStripeAppearance();

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
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-6xl px-6 pt-24">
        {/* Barra de confianza */}
        <div className="flex items-center justify-between gap-4 border-b border-border py-3 text-xs">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-text-muted transition-colors duration-150 hover:text-text"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {backLabel}
          </Link>
          <span className="flex items-center gap-2 font-medium text-success">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Pasarela encriptada TLS 1.3
          </span>
        </div>

        {/* Header */}
        <header className="pt-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Zap className="size-3.5" aria-hidden />
            Checkout seguro
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            {subtitle}
          </p>
        </header>

        {/* Dos columnas */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div className="checkout-rise">
            <OrderSummary checkout={checkout} />
          </div>

          <div className="checkout-rise checkout-rise-2">
            <Elements
              stripe={getStripe()}
              options={{ clientSecret, appearance: stripeAppearance }}
            >
              <PaymentForm
                returnUrl={returnUrl}
                successParams={successParams}
                submitLabel={submitLabel}
              />
            </Elements>
          </div>
        </div>

        <CheckoutStats />

        <div className="pb-20" />
      </div>
    </div>
  );
}

const CHECKOUT_STATS: {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}[] = [
  /* Antes: "+45.000 estudiantes", "98.4% de satisfacción", "120+ proyectos",
     "< 15 min de respuesta": cifras inventadas justo donde se pide la tarjeta.
     Ahora, sólo lo que el checkout garantiza de verdad. */
  { icon: Lock, value: "Pago seguro", label: "Procesado por Stripe", color: "text-success" },
  { icon: Zap, value: "Inmediato", label: "Acceso apenas se confirma el pago", color: "text-accent" },
  { icon: RotateCcw, value: "14 días", label: "Garantía de reembolso", color: "text-success" },
  { icon: Sparkles, value: "Tutor IA", label: "En cada lección", color: "text-primary" },
];

function CheckoutStats() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 border-t border-border pt-8 lg:grid-cols-4">
      {CHECKOUT_STATS.map(({ icon: Icon, value, label, color }) => (
        <div key={label} className="rounded-xl bg-surface border border-border px-5 py-5 text-center">
          <Icon className={`mx-auto size-5 ${color}`} aria-hidden />
          <p className="mt-2 text-2xl font-bold text-text">{value}</p>
          <p className="mt-1 text-xs text-text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
