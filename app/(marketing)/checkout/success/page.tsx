import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Pago confirmado — Campus",
};

/* Acá redirige Stripe después de un pago exitoso (return_url en
   PaymentForm.tsx). TODO (backend): Stripe puede redirigir acá ANTES de
   que el webhook termine de procesar el pago (son dos cosas async en
   paralelo) — no alcanza con "llegué a esta URL" para dar el curso/plan
   por activado. Cuando exista el endpoint, esta página debería leer
   ?payment_intent=... de la query y consultarle al back el estado real
   (o simplemente decir "ya casi" y que el usuario vea el curso activado
   la próxima vez que entre a /dashboard, una vez que el webhook corrió). */
export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-4 py-24 text-center">
      <span className="bg-success-subtle text-success flex size-14 items-center justify-center rounded-full">
        <CheckCircle2 className="size-7" aria-hidden />
      </span>
      <h1 className="text-text text-2xl font-bold">¡Listo, gracias por tu compra!</h1>
      <p className="text-text-secondary max-w-sm text-sm">
        Estamos confirmando el pago con Stripe — puede tardar unos segundos
        en reflejarse. Ya podés ir a tu dashboard.
      </p>
      <Link
        href="/dashboard"
        className="bg-primary-solid hover:bg-primary-solid-hover mt-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150"
      >
        Ir a mi dashboard
      </Link>
    </div>
  );
}
