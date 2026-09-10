import type { Metadata } from "next";

import { CheckoutSuccess } from "@/components/checkout/CheckoutSuccess";

export const metadata: Metadata = {
  title: "Pago confirmado — Campus",
};

/* Acá redirige Stripe después de un pago exitoso (return_url, armado en
   CheckoutPage.tsx/PaymentForm.tsx con ?type=course&courseId=... o
   ?type=subscription — Stripe le agrega los suyos al lado, payment_intent
   y redirect_status, sin pisar los nuestros).

   Es un Server Component: `searchParams` llega como prop (no hace falta
   useSearchParams ni Suspense acá). CheckoutSuccess sí es client y hace el
   polling real contra el back — ver services/checkout.service.ts. */
export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">,
) {
  const searchParams = await props.searchParams;
  const type = searchParams.type === "subscription" ? "subscription" : "course";
  const courseId =
    typeof searchParams.courseId === "string" ? searchParams.courseId : null;
  // Lo agrega Stripe a la return_url. Con él, CheckoutSuccess le pide al back
  // que verifique el cobro contra Stripe y active el acceso sin esperar al
  // webhook.
  const paymentIntentId =
    typeof searchParams.payment_intent === "string"
      ? searchParams.payment_intent
      : null;

  return (
    <CheckoutSuccess
      type={type}
      courseId={courseId}
      paymentIntentId={paymentIntentId}
    />
  );
}
