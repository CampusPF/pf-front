"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { ApiError } from "@/services/api-client";
import {
  createPaymentIntent,
  hasAccess,
  type PendingAccessCheck,
} from "@/services/checkout.service";
import { getCourseBySlug } from "@/services/courses/courses.service";
import type { Course as CatalogCourse } from "@/types/course.types";
import type { CheckoutInput, Course } from "@/types/checkout";
import { PREMIUM_PLAN } from "@/data/plans";

/* El checkout necesita mostrar título/instructor/precio, pero no toda la
   ficha del curso (módulos, tags, etc.) — de ahí que types/checkout.ts
   tenga su propio Course, más chico. `getCourseBySlug` ya devuelve el curso
   adaptado (services/courses/courses.adapter.ts); si todavía no tiene
   portada subida, `thumbnailUrl` queda en null y el resumen muestra un
   bloque neutro en vez de una imagen rota. */
function toCheckoutCourse(course: CatalogCourse): Course {
  return {
    id: course.id,
    title: course.title,
    instructor: course.instructor?.name ?? "Campus",
    thumbnailUrl: course.imageUrl || null,
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

/* El pago no se pudo iniciar: el back rechazó el create-intent (curso ya
   borrado, precio en cero, Stripe sin configurar) o no hubo respuesta.
   Muestra el motivo REAL que manda el back y ofrece reintentar — nunca
   detalles internos como `clientSecret`, que no significan nada para quien
   está comprando. */
function PaymentUnavailableState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-4 py-20 text-center">
      <span className="bg-danger-subtle text-danger flex size-14 items-center justify-center rounded-full">
        <AlertCircle className="size-7" aria-hidden />
      </span>
      <h1 className="text-text text-xl font-semibold">
        No pudimos iniciar el pago
      </h1>
      <p className="text-text-secondary max-w-sm text-sm">{message}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="bg-primary-solid hover:bg-primary-solid-hover cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
        >
          Reintentar
        </button>
        <Link
          href="/courses"
          className="border-border text-text-secondary hover:bg-surface-elevated hover:text-text rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150"
        >
          Volver a cursos
        </Link>
      </div>
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
    | { status: "error"; message: string }
    | { status: "ready"; clientSecret: string }
  >({ status: "checking" });
  // Cambia al tocar "Reintentar" y vuelve a disparar el efecto.
  const [attempt, setAttempt] = useState(0);
  // Id primitivo en vez de `checkout` (objeto nuevo en cada render del
  // padre) como dependencia: si no, cualquier re-render de arriba dispara
  // un create-intent nuevo aunque siga siendo la misma compra.
  const itemId = checkout.mode === "course" ? checkout.course.id : checkout.plan.id;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const check: PendingAccessCheck =
        checkout.mode === "course"
          ? { mode: "course", courseId: itemId }
          : { mode: "subscription" };

      if (await hasAccess(check)) {
        if (!cancelled) setState({ status: "already-owned" });
        return;
      }

      try {
        const { clientSecret } = await createPaymentIntent(
          checkout.mode === "course" ? { courseId: itemId } : { planId: itemId },
        );
        if (!cancelled) setState({ status: "ready", clientSecret });
      } catch (error) {
        if (cancelled) return;

        // 409 = el back ya lo tenía registrado (una compra que se activó
        // mientras mirábamos). No es un error: es "ya es tuyo".
        if (error instanceof ApiError && error.status === 409) {
          setState({ status: "already-owned" });
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "No pudimos iniciar el pago. Probá de nuevo en un momento.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se dispara por itemId (y el modo, fijo por instancia), no por la identidad de `checkout`
  }, [itemId, attempt]);

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

  if (state.status === "error") {
    return (
      <PaymentUnavailableState
        message={state.message}
        onRetry={() => {
          setState({ status: "checking" });
          setAttempt((value) => value + 1);
        }}
      />
    );
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
