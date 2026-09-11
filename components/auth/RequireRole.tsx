"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import type { User } from "@/services/auth/auth.types";

type Role = NonNullable<User["role"]>;

/* Gate por rol, para usar ADENTRO de un área que ya tiene RequireAuth.

   Es sólo UX: esconde pantallas que no le sirven al usuario. La seguridad
   real está en el back (RolesGuard), que igual responde 403.

   `role` llega por GET /users/me (el AuthProvider lo pide al montar). El
   user del login no lo trae, así que mientras no esté se muestra nada en vez
   de un "no tenés acceso" en falso. */
export default function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user?.role) return null;

  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
        <ShieldAlert className="text-text-muted size-10" aria-hidden />
        <h1 className="text-text text-xl font-semibold">No tenés acceso a esta sección</h1>
        <p className="text-text-secondary text-sm">
          Es sólo para el equipo de Campus.
        </p>
        <Link href="/dashboard" className="text-primary text-sm font-medium hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
