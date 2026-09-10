"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import {
  syncPayment,
  waitForAccessConfirmation,
} from "@/services/checkout.service";
import { formatPrice } from "@/types/checkout";
import { PREMIUM_PLAN } from "@/data/plans";

interface CheckoutSuccessProps {
  type: "course" | "subscription";
  /** UUID real del curso (viene de CheckoutPage vía successParams). Nulo si
      type es "subscription" o si algo raro pasó con la URL de retorno. */
  courseId: string | null;
  /** `payment_intent` que Stripe agrega a la return_url. */
  paymentIntentId: string | null;
}

type Phase = "confirming" | "confirmed" | "timeout";

/* Pantalla de confirmación tras un pago exitoso. Ocupa toda la ventana
   (fixed inset-0) a propósito: tapa el Navbar/Footer del layout (marketing)
   para replicar el diseño de confirmación "a foco completo".

   stripe.confirmPayment() redirige acá apenas Stripe confirma el cobro.
   Llegar a esta URL no prueba nada por sí solo, así que:

     1. Le pide al back que sincronice el pago (POST /payments/:id/sync): el
        back le pregunta a Stripe y, si el cobro está confirmado, activa el
        acceso en el acto. Es lo que hace que funcione sin webhook.
     2. Después pollea GET /course-enrollments/me o /subscriptions/me hasta
        ver el acceso real (ver waitForAccessConfirmation). Si el paso 1
        falló por lo que sea, esto sigue esperando al webhook como respaldo. */
export function CheckoutSuccess({
  type,
  courseId,
  paymentIntentId,
}: CheckoutSuccessProps) {
  const [phase, setPhase] = useState<Phase>("confirming");
  const [animateIcon, setAnimateIcon] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (paymentIntentId) await syncPayment(paymentIntentId);

      const confirmed = await waitForAccessConfirmation(
        type === "course" && courseId
          ? { mode: "course", courseId }
          : { mode: "subscription" },
      );

      if (!cancelled) setPhase(confirmed ? "confirmed" : "timeout");
    })();

    return () => {
      cancelled = true;
    };
  }, [type, courseId, paymentIntentId]);

  useEffect(() => {
    if (phase === "confirming") return;
    const id = requestAnimationFrame(() => setAnimateIcon(true));
    return () => cancelAnimationFrame(id);
  }, [phase]);

  const heading =
    phase === "confirming"
      ? "Confirmando tu pago…"
      : phase === "timeout"
        ? "¡Pago recibido!"
        : type === "course"
          ? "¡Listo, el curso ya es tuyo!"
          : "¡Listo, ya sos parte de Campus Premium!";

  const description =
    phase === "confirming"
      ? "Esto tarda unos segundos — estamos confirmando el pago con Stripe."
      : phase === "timeout"
        ? "El pago se confirmó, pero activarlo está tardando un poco más de lo normal. Va a estar disponible en tu dashboard en breve."
        : type === "course"
          ? "Te enviamos un email de confirmación. Ya tenés acceso de por vida a este curso."
          : "Te enviamos un email de confirmación. Tu suscripción está activa desde ahora.";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#0B0B14] px-4 py-10">
      {/* Glow verde/teal sutil en el borde derecho */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(45% 55% at 100% 42%, rgba(16, 185, 129, 0.16), transparent 72%), radial-gradient(35% 40% at 92% 88%, rgba(20, 184, 166, 0.1), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[480px] rounded-2xl bg-[#1A1A2E] p-8 shadow-2xl shadow-black/50">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-[#22C55E]/15 text-[#22C55E]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="m9 8-4 4 4 4M15 8l4 4-4 4M13.5 6l-3 12" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold text-white">Campus.</span>
        </div>

        {/* Ícono: spinner mientras confirma, check animado ya resuelto */}
        <div className="relative mx-auto mt-8 flex size-16 items-center justify-center">
          {phase === "confirming" ? (
            <Loader2 className="size-10 animate-spin text-[#6366F1]" aria-hidden />
          ) : (
            <div
              className={`checkout-fx relative flex size-16 items-center justify-center ${
                animateIcon ? "checkout-fx--in" : ""
              }`}
            >
              <span
                aria-hidden
                className="checkout-ring absolute inset-0 rounded-full bg-[#22C55E]"
              />
              <span className="checkout-icon relative flex size-16 items-center justify-center rounded-full bg-[#22C55E]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="checkout-check size-8 text-white"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </div>
          )}
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold text-white">{heading}</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-[#A1A1AA]">
          {description}
        </p>

        {phase !== "confirming" && (
          <>
            <hr className="my-6 border-white/10" />

            {/* Resumen */}
            <div className="rounded-xl bg-white/3 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-white">
                  {type === "course"
                    ? "Curso comprado"
                    : `${PREMIUM_PLAN.name} · ${formatPrice(PREMIUM_PLAN.priceInCents, PREMIUM_PLAN.currency)} / mes`}
                </span>
                <span className="shrink-0 rounded-full bg-[#6366F1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {phase === "timeout" ? "Procesando" : "Activo"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#8A8A99]">
                {type === "course"
                  ? "Acceso de por vida, sin vencimiento."
                  : "Se renueva automáticamente cada mes — cancelás cuando quieras."}
              </p>
            </div>

            {/* Acciones */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg bg-[#6366F1] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors duration-150 hover:bg-[#5558E3]"
              >
                Ir a mi dashboard
              </Link>
              <Link
                href="/courses"
                className="rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm font-medium text-[#D4D4D8] transition-colors duration-150 hover:bg-white/6"
              >
                Explorar cursos
              </Link>
            </div>

            <p className="mt-6 text-center text-[11px] text-[#6B6B7B]">
              ¿Dudas? Escribinos a{" "}
              <a
                href="mailto:soporte@campus.com"
                className="text-[#8A8A99] transition-colors duration-150 hover:text-[#A1A1AA]"
              >
                soporte@campus.com
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
