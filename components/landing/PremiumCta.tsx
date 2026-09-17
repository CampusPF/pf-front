"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";

const BUTTON =
  "block w-full rounded-lg py-3 text-center font-medium transition-colors duration-150";

/* Botón del plan Premium en la landing. Es client sólo para leer el rol: el
   admin ya tiene todo el catálogo y el checkout le está cerrado, así que en
   vez de "Hacerme Premium" ve que ya está incluido. El docente no: Premium le
   da los cursos pagos de otros docentes, que por su rol no tiene. */
export default function PremiumCta() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return (
      <p className={`${BUTTON} bg-success-subtle text-success`}>Incluido en tu rol</p>
    );
  }

  return (
    <Link
      href="/checkout?plan=premium"
      className={`${BUTTON} bg-primary-solid hover:bg-primary-solid-hover cursor-pointer text-white`}
    >
      Hacerme Premium
    </Link>
  );
}
