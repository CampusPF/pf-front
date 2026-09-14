import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * loadStripe() hace una llamada de red la primera vez que se invoca,
 * por eso lo cacheamos en un singleton en vez de llamarlo en cada render.
 *
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY va en el .env.local del proyecto.
 * El prefijo NEXT_PUBLIC_ es obligatorio en Next.js para que la variable
 * quede disponible del lado del cliente. Es la clave PÚBLICA
 * (pk_test_... / pk_live_...), nunca la secreta: esa vive solo en el backend.
 *
 * `developerTools.assistant.enabled: false` apaga el "Stripe Elements
 * sandbox assistant": el pill "stripe ›" que aparece abajo a la derecha
 * cuando la clave es de test. Stripe lo inyecta en <body>, fuera del árbol
 * de React, así que al salir del checkout con routing de Next (sin recargar
 * la página) React nunca lo desmonta y queda flotando en cualquier pantalla
 * — incluida la landing, después de volver de un pago. Viene prendido por
 * default para Elements con Payment Intents desde la versión "Clover" de
 * Stripe.js en adelante (la instalada acá, "dahlia", ya la incluye). Con una
 * clave pk_live_ de producción Stripe no lo muestra ni con esta opción en
 * false; se explicita igual para no depender de eso y sacarlo también en
 * desarrollo/test, donde molestaba mientras se probaba el checkout repetidas
 * veces. No afecta la detección de fraude real del cobro: es sólo la ayuda
 * para desarrolladores. https://docs.stripe.com/js/initializing
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error(
        "Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en las variables de entorno."
      );
    }

    stripePromise = loadStripe(publishableKey ?? "", {
      developerTools: { assistant: { enabled: false } },
    });
  }
  return stripePromise;
}
