"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

/* El admin no compra: ve todo el catálogo y se inscribe sin pagar a cualquier
   curso. Si llega al checkout (link directo, "Hacerme Premium" desde otra
   pestaña) se le explica en vez de mostrar el formulario de pago. Es UX: el
   back responde 403 a POST /payments/create-intent para ese rol.

   El docente SÍ pasa: sólo tiene gratis los cursos gratuitos y los suyos, así
   que un curso pago de otro docente lo compra (o se suscribe a Premium) como
   cualquier alumno. Comprar su propio curso lo frena el back con un 409, y el
   front nunca le ofrece ese checkout (EnrollCTA le muestra "Ir al curso").

   Va adentro de RequireAuth, así que la sesión ya está resuelta. */
export default function BlockAdminFromCheckout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Sin rol todavía (llega por /users/me) no se decide nada.
  if (!user?.role) return null;

  if (user.role === "admin") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 pt-32 pb-20 text-center">
        <span className="bg-success-subtle text-success flex size-14 items-center justify-center rounded-full">
          <ShieldCheck className="size-7" aria-hidden />
        </span>
        <h1 className="text-text text-xl font-semibold">No necesitás comprar nada</h1>
        <p className="text-text-secondary text-sm">
          Como administrador ya tenés acceso a todos los cursos, incluidos los pagos.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/courses"
            className="bg-primary-solid hover:bg-primary-solid-hover rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
          >
            Ver cursos
          </Link>
          <Link
            href="/dashboard"
            className="border-border text-text-secondary hover:bg-surface-elevated hover:text-text rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150"
          >
            Ir a mi dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
