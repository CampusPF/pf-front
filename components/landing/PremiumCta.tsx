"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { isStaffRole } from "@/lib/lesson-access";

const BUTTON =
  "block w-full rounded-lg py-3 text-center font-medium transition-colors duration-150";

/* Botón del plan Premium en la landing. Es client sólo para leer el rol:
   admin y teacher ya tienen todo el catálogo y el checkout les está cerrado,
   así que en vez de "Hacerme Premium" ven que ya está incluido. */
export default function PremiumCta() {
  const { user } = useAuth();

  if (isStaffRole(user?.role)) {
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
