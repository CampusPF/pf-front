import type { SubscriptionPlan } from "@/types/checkout";

/* Único plan pago hoy (ver components/landing/PricingSection.tsx). Cuando
   haya más de uno esto pasa a salir de una llamada al back en vez de estar
   hardcodeado acá.

   priceInCents/currency TIENEN que coincidir con lo que de verdad cobra el
   back (PLAN_PRICES_IN_CENTS en subscriptions.service.ts): no hay ningún
   endpoint que exponga el precio real, así que es un valor duplicado a mano.
   Vive en su propio módulo para que el checkout y la pantalla de éxito lean
   el MISMO número — la de éxito tenía "US$ 19,00" escrito a mano mientras el
   back cobraba $9,99. */
export const PREMIUM_PLAN: SubscriptionPlan = {
  id: "premium",
  name: "Plan Premium",
  description:
    "Acceso ilimitado a todo el catálogo de cursos de ingeniería de software, arquitecturas cloud, IA aplicada y mentorías semanales.",
  priceInCents: 999,
  currency: "usd",
  interval: "month",
  features: [
    "+120 cursos de frontend, backend e IA",
    "Certificados oficiales verificables en GitHub / LinkedIn",
    "Comunidad exclusiva en Discord y code reviews en vivo",
    "Entornos de laboratorio y sandboxes en la nube",
  ],
};
