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
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error(
        "Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en las variables de entorno."
      );
    }

    stripePromise = loadStripe(publishableKey ?? "");
  }
  return stripePromise;
}
