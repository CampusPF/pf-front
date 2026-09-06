"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

/* Página puente del login con Google.

   El back valida contra Google y redirige acá con ?token=... (SÓLO el token).
   Esta pantalla lo lee, completa la sesión (token + /users/me) y manda al
   dashboard. Vive fuera de los route groups (marketing/app) a propósito: no
   lleva navbar ni sidebar, es sólo una transición.

   Va envuelta en <Suspense> porque useSearchParams lo exige en el App Router. */

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithGoogleToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Guard contra el doble-render de React en dev (StrictMode): el efecto no
  // debe intentar canjear el token dos veces.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = params.get("token");

    if (!token) {
      setError("No recibimos un token de sesión. Volvé a iniciar sesión.");
      return;
    }

    loginWithGoogleToken(token)
      .then(() => {
        // replace (no push): saca /auth/callback?token=... del historial, así
        // el token no queda en la URL ni al apretar "atrás".
        router.replace("/dashboard");
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : "No pudimos completar el inicio de sesión.";
        setError(message);
      });
  }, [params, loginWithGoogleToken, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="bg-danger-subtle text-danger flex size-12 items-center justify-center rounded-full">
          <AlertCircle className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-text text-lg font-semibold">
            No pudimos iniciar sesión
          </h1>
          <p className="text-text-secondary mt-1 max-w-sm text-sm">{error}</p>
        </div>
        <Link
          href="/login"
          className="bg-primary hover:bg-primary-hover mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
      <div>
        <h1 className="text-text text-lg font-semibold">Iniciando sesión…</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Estamos preparando tu campus, esto tarda un segundo.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="bg-bg flex min-h-dvh items-center justify-center px-4">
      <Suspense
        fallback={
          <Loader2
            className="text-primary size-8 animate-spin"
            aria-hidden
          />
        }
      >
        <CallbackInner />
      </Suspense>
    </main>
  );
}
