"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

const TABS = [
  // El docente también: ve las métricas de SUS cursos (GET /admin/stats
  // devuelve el alcance según el rol del token).
  { label: "Resumen", href: "/dashboard/admin", adminOnly: false },
  { label: "Cursos", href: "/dashboard/admin/cursos", adminOnly: false },
  // El docente ve las ventas de SUS cursos; el admin, las de toda la
  // plataforma. El alcance lo decide el back según el rol del token.
  { label: "Ventas", href: "/dashboard/admin/ventas", adminOnly: false },
  { label: "Categorías", href: "/dashboard/admin/categorias", adminOnly: true },
  { label: "Foro", href: "/dashboard/admin/foro", adminOnly: true },
  { label: "Usuarios", href: "/dashboard/admin/usuarios", adminOnly: true },
];

export default function AdminNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div>
      <h1 className="text-text text-2xl font-bold md:text-3xl">
        {isAdmin ? "Administración" : "Mis cursos como docente"}
      </h1>
      {/* Con 5 pestañas (admin) no entran en 390px: se desplazan dentro de la
          barra en lugar de ensanchar toda la página. El borde va en el div
          interno para que el `-mb-px` de la pestaña activa no genere scroll
          vertical dentro del contenedor con overflow. */}
      <nav aria-label="Secciones de administración" className="mt-4 overflow-x-auto scrollbar-none">
        <div className="border-border flex w-max min-w-full gap-1 border-b">
          {TABS.filter((tab) => isAdmin || !tab.adminOnly).map((tab) => {
            const active =
              tab.href === "/dashboard/admin" ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                // px-3 en mobile: con px-4 los 4 tabs medían 8px más que una
                // pantalla de 390px y ensanchaban toda la página.
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 ${
                  active ? "border-primary text-primary" : "text-text-muted hover:text-text border-transparent"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
