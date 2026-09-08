"use client";

import { useEffect, useState } from "react";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import type { Course, SubscriptionPlan } from "@/types/checkout";

const mockCourse: Course = {
  id: "curso-react-avanzado",
  title: "React Avanzado: Patrones y Performance",
  instructor: "Prof. Lucía Fernández",
  thumbnailUrl: "https://placehold.co/200x120",
  priceInCents: 4999,
  currency: "usd",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockPlan: SubscriptionPlan = {
  id: "plan-mensual",
  name: "Plan Mensual",
  description: "Acceso a todo el catálogo de cursos",
  priceInCents: 1999,
  currency: "usd",
  interval: "month",
};

/**
 * Ejemplo de integración. En tu app real:
 * 1. El usuario llega acá desde "Comprar" (courseId) en la página del curso,
 *    o desde "Suscribirme" (planId) en la página de planes.
 * 2. Al montar, llamás a tu backend (POST /payments/create-intent) con
 *    { courseId } o { planId } para que cree el PaymentIntent en Stripe
 *    y devuelva el client_secret.
 * 3. Ese secret se lo pasás a <CheckoutPage />.
 *
 * Este ejemplo usa mockCourse. Para probar el flujo de suscripción,
 * cambiá el checkout de abajo por: { mode: "subscription", plan: mockPlan }
 */
export default function Page() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // TODO (backend): reemplazar por la llamada real, algo así:
    //
    // fetch("/api/payments/create-intent", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ courseId: mockCourse.id }),
    //   // o body: JSON.stringify({ planId: mockPlan.id }) para suscripción
    // })
    //   .then((res) => res.json())
    //   .then((data) => setClientSecret(data.clientSecret));
  }, []);

  return (
    <CheckoutPage
      checkout={{ mode: "course", course: mockCourse }}
      clientSecret={clientSecret}
    />
  );
}
