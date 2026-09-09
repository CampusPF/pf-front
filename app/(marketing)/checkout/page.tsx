"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { createPaymentIntent } from "@/services/checkout.service";
import { MOCK_COURSES } from "@/data/courses.mock";
import type { Course as CatalogCourse } from "@/types/course.types";
import type { CheckoutInput, Course, SubscriptionPlan } from "@/types/checkout";

/* Único plan pago hoy (ver components/landing/PricingSection.tsx). Cuando
   haya más de uno esto pasa a salir de una llamada al back en vez de estar
   hardcodeado acá. */
const PREMIUM_PLAN: SubscriptionPlan = {
  id: "premium",
  name: "Plan Premium",
  description: "Acceso ilimitado a todo el catálogo de cursos",
  priceInCents: 1900,
  currency: "usd",
  interval: "month",
};

/* El checkout necesita mostrar título/instructor/precio, pero no toda la
   ficha del curso (módulos, tags, etc.) — de ahí que types/checkout.ts
   tenga su propio Course, más chico. El catálogo todavía no tiene una
   imagen de portada real (sólo coverGradient, clases de Tailwind), así que
   por ahora usamos un placeholder acá. */
function toCheckoutCourse(course: CatalogCourse): Course {
  return {
    id: course.id,
    title: course.title,
    instructor: course.instructor.name,
    thumbnailUrl: "https://placehold.co/200x120",
    priceInCents: course.priceInCents,
    currency: course.currency,
  };
}

function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const courseSlug = searchParams.get("courseId");
  const planId = searchParams.get("plan");

  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const course = courseSlug
    ? MOCK_COURSES.find((item) => item.slug === courseSlug)
    : null;
  const checkout: CheckoutInput | null = course
    ? { mode: "course", course: toCheckoutCourse(course) }
    : planId === "premium"
      ? { mode: "subscription", plan: PREMIUM_PLAN }
      : null;

  useEffect(() => {
    if (!checkout) return;

    let cancelled = false;

    // TODO (backend): POST /payments/create-intent todavía no existe.
    // Mientras tanto createPaymentIntent devuelve null y CheckoutPage
    // muestra el placeholder de "Datos de pago" en vez de romper.
    createPaymentIntent(
      checkout.mode === "course"
        ? { courseId: checkout.course.id }
        : { planId: checkout.plan.id },
    ).then((result) => {
      if (!cancelled) setClientSecret(result?.clientSecret ?? null);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se dispara por checkout.mode/id, no por la identidad del objeto
  }, [checkout?.mode, courseSlug, planId]);

  if (!checkout) {
    return (
      <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-4 py-20 text-center">
        <AlertCircle className="text-text-muted size-10" aria-hidden />
        <h1 className="text-text text-xl font-semibold">
          No sabemos qué querés comprar
        </h1>
        <p className="text-text-secondary max-w-sm text-sm">
          A esta página se llega desde el botón de &quot;Comprar&quot; de un
          curso o &quot;Hacerme Premium&quot; en los planes — no se puede
          abrir directamente.
        </p>
        <Link
          href="/courses"
          className="bg-primary-solid hover:bg-primary-solid-hover mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
        >
          Ver cursos
        </Link>
      </div>
    );
  }

  return <CheckoutPage checkout={checkout} clientSecret={clientSecret} />;
}

export default function Page() {
  return (
    <Suspense>
      <CheckoutPageInner />
    </Suspense>
  );
}
