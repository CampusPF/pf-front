"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { createPaymentIntent, hasAccess } from "@/services/checkout.service";
import { getCourseBySlug } from "@/services/courses/courses.service";
import type { Course as CatalogCourse } from "@/types/course.types";
import type { CheckoutInput, Course, SubscriptionPlan } from "@/types/checkout";

/* Único plan pago hoy (ver components/landing/PricingSection.tsx). Cuando
   haya más de uno esto pasa a salir de una llamada al back en vez de estar
   hardcodeado acá.

   priceInCents/currency TIENEN que coincidir con lo que de verdad cobra el
   back (PLAN_PRICES_IN_CENTS en subscriptions.service.ts) — no hay ningún
   endpoint que exponga el precio real, así que hoy es un valor duplicado a
   mano en los dos lados. Estaba en 1900 ($19,00) mientras el back cobra
   999 ($9,99) — el usuario paga un precio distinto al que el checkout le
   mostró, además de que /#precios sigue anunciando $19. Corregido acá al
   valor real; falta alinear también la landing (ver PricingSection.tsx) y,
   más a fondo, que el precio salga de un solo lugar. Saqué el descuento
   falso (-35% de $29) porque no correspondía a ningún precio real. */
const PREMIUM_PLAN: SubscriptionPlan = {
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

/* El checkout necesita mostrar título/instructor/precio, pero no toda la
   ficha del curso (módulos, tags, etc.) — de ahí que types/checkout.ts
   tenga su propio Course, más chico. El catálogo todavía no tiene una
   imagen de portada real (sólo coverGradient, clases de Tailwind), así que
   por ahora usamos un placeholder acá.

   Defensivo con instructor/precio: el contrato dice que el back devuelve
   el mismo shape de @/types/course.types, pero hoy `instructor` en la
   entidad real es el User completo (no el { name, title, avatarUrl } del
   contrato) — hasta que eso se alinee, evitamos romper el checkout por un
   campo con otra forma. */
function toCheckoutCourse(course: CatalogCourse): Course {
  return {
    id: course.id,
    title: course.title,
    instructor: course.instructor?.name ?? "Campus",
    thumbnailUrl: "https://placehold.co/200x120",
    priceInCents: course.priceInCents ?? 0,
    currency: course.currency ?? "usd",
  };
}

function NotFoundState({ isError = false }: { isError?: boolean }) {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-4 py-20 text-center">
      <AlertCircle className="text-text-muted size-10" aria-hidden />
      <h1 className="text-text text-xl font-semibold">
        {isError ? "No pudimos cargar el curso" : "No sabemos qué querés comprar"}
      </h1>
      <p className="text-text-secondary max-w-sm text-sm">
        {isError
          ? "Probá de nuevo en un momento."
          : 'A esta página se llega desde el botón de "Comprar" de un curso o "Hacerme Premium" en los planes — no se puede abrir directamente.'}
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

/* Resuelve el curso real contra el back (GET /courses vía
   courses.service.ts) — antes esto buscaba en MOCK_COURSES, así que el id
   que viajaba a POST /payments/create-intent era "1"/"2"/"3" (mock), nunca
   un UUID real.

   Se monta con key={courseSlug} desde el padre (ver Page más abajo): así,
   si el usuario navega de un curso a otro sin recargar la página, este
   componente vuelve a nacer de cero (el inicializador de useState resuelve
   "loading" de entrada) en vez de tener que resetear el estado a mano
   dentro de un efecto — evita el patrón de setState síncrono en un efecto. */
function CourseCheckout({ courseSlug }: { courseSlug: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "not-found" }
    | { status: "error" }
    | { status: "ready"; course: Course }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getCourseBySlug(courseSlug)
      .then((course) => {
        if (cancelled) return;
        setState(
          course
            ? { status: "ready", course: toCheckoutCourse(course) }
            : { status: "not-found" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [courseSlug]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-4 py-24 text-center">
        <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
        <p className="text-text-secondary text-sm">Buscando el curso…</p>
      </div>
    );
  }

  if (state.status !== "ready") {
    return <NotFoundState isError={state.status === "error"} />;
  }

  return <PaymentCheckout checkout={{ mode: "course", course: state.course }} />;
}

function AlreadyOwnedState({ checkout }: { checkout: CheckoutInput }) {
  const isCourse = checkout.mode === "course";
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-4 py-20 text-center">
      <span className="bg-success-subtle text-success flex size-14 items-center justify-center rounded-full">
        <CheckCircle2 className="size-7" aria-hidden />
      </span>
      <h1 className="text-text text-xl font-semibold">
        {isCourse ? "Ya tenés este curso" : "Ya sos Premium"}
      </h1>
      <p className="text-text-secondary max-w-sm text-sm">
        {isCourse
          ? `Ya comprás "${checkout.course.title}" — no hace falta pagarlo de nuevo.`
          : "Tu suscripción ya está activa. Podés cancelarla desde tu dashboard cuando quieras."}
      </p>
      <Link
        href="/dashboard"
        className="bg-primary-solid hover:bg-primary-solid-hover mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
      >
        Ir a mi dashboard
      </Link>
    </div>
  );
}

/* Punto único que crea el PaymentIntent, una vez que ya sabemos qué se
   compra (curso real resuelto, o el plan fijo). Antes de pedirlo, chequea
   si el usuario ya tiene acceso — si no, cualquiera podía volver a pagar
   un curso ya comprado o una suscripción ya activa (el back lo rechaza
   con 409, pero eso no es una experiencia, es un error en consola). */
function PaymentCheckout({ checkout }: { checkout: CheckoutInput }) {
  const [state, setState] = useState<
    | { status: "checking" }
    | { status: "already-owned" }
    | { status: "ready"; clientSecret: string | null }
  >({ status: "checking" });
  // Id primitivo en vez de `checkout` (objeto nuevo en cada render del
  // padre) como dependencia: si no, cualquier re-render de arriba dispara
  // un create-intent nuevo aunque siga siendo la misma compra.
  const itemId = checkout.mode === "course" ? checkout.course.id : checkout.plan.id;

  useEffect(() => {
    let cancelled = false;

    hasAccess(
      checkout.mode === "course" ? { mode: "course", courseId: itemId } : { mode: "subscription" },
    ).then((owned) => {
      if (cancelled) return;
      if (owned) {
        setState({ status: "already-owned" });
        return;
      }

      createPaymentIntent(
        checkout.mode === "course" ? { courseId: itemId } : { planId: itemId },
      ).then((result) => {
        if (!cancelled) setState({ status: "ready", clientSecret: result?.clientSecret ?? null });
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se dispara por itemId (y el modo, fijo por instancia), no por la identidad de `checkout`
  }, [itemId]);

  if (state.status === "checking") {
    return (
      <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-4 py-24 text-center">
        <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
        <p className="text-text-secondary text-sm">Verificando tu cuenta…</p>
      </div>
    );
  }

  if (state.status === "already-owned") {
    return <AlreadyOwnedState checkout={checkout} />;
  }

  return <CheckoutPage checkout={checkout} clientSecret={state.clientSecret} />;
}

function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const courseSlug = searchParams.get("courseId");
  const planId = searchParams.get("plan");

  if (planId === "premium") {
    return (
      <PaymentCheckout checkout={{ mode: "subscription", plan: PREMIUM_PLAN }} />
    );
  }

  if (courseSlug) {
    return <CourseCheckout key={courseSlug} courseSlug={courseSlug} />;
  }

  return <NotFoundState />;
}

export default function Page() {
  return (
    <Suspense>
      <CheckoutPageInner />
    </Suspense>
  );
}
