"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

/* Protección de rutas del lado del cliente. Reemplaza lo que antes hacía
   proxy.ts leyendo una cookie: en producción front y back viven en dominios
   distintos, así que una cookie seteada por el back nunca le llega al
   servidor de Next cuando alguien navega al front — el chequeo server-side
   quedaba SIEMPRE en falso, bloqueando incluso a usuarios logueados. La
   sesión sólo existe de forma confiable en localStorage, que es cliente.

   Se usa envolviendo el layout de cada área protegida (ver
   app/(app)/layout.tsx y app/(marketing)/courses/[slug]/learn/layout.tsx).
   Mientras isLoading es true no se sabe todavía si hay sesión — no
   redirige ni muestra nada para evitar un parpadeo/redirect en falso. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    const search = searchParams.toString();
    const redirect = encodeURIComponent(search ? `${pathname}?${search}` : pathname);
    router.replace(`/login?redirect=${redirect}`);
  }, [isLoading, isAuthenticated, pathname, searchParams, router]);

  if (isLoading || !isAuthenticated) return null;

  return <>{children}</>;
}
