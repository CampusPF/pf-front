"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

const DEFAULT_AUTHENTICATED_ROUTE = "/courses";

/* Lo inverso de RequireAuth: para /login y /register. Si ya hay sesión no
   tiene sentido mostrar el formulario — igual que en RequireAuth, esto
   antes lo resolvía proxy.ts leyendo la cookie del back en el server, pero
   esa cookie no le llega al front en producción (dominios distintos), así
   que el chequeo se mueve acá, contra el localStorage real. */
export default function RedirectIfAuthenticated({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const redirect = searchParams.get("redirect");
    router.replace(redirect?.startsWith("/") ? redirect : DEFAULT_AUTHENTICATED_ROUTE);
  }, [isLoading, isAuthenticated, searchParams, router]);

  if (isLoading || isAuthenticated) return null;

  return <>{children}</>;
}
