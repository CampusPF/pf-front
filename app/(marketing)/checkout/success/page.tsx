import type { Metadata } from "next";

import { CheckoutSuccess } from "@/components/checkout/CheckoutSuccess";

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
   la próxima vez que entre a /dashboard, una vez que el webhook corrió).
   Los datos que muestra CheckoutSuccess (plan, próxima facturación, ID de
   transacción) son placeholders del diseño hasta que ese endpoint exista. */
export default function CheckoutSuccessPage() {
  return <CheckoutSuccess />;
}
