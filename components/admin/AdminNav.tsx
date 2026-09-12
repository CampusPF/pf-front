"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

const TABS = [
  { label: "Resumen", href: "/dashboard/admin", adminOnly: true },
  { label: "Cursos", href: "/dashboard/admin/cursos", adminOnly: false },
  { label: "Categorías", href: "/dashboard/admin/categorias", adminOnly: true },
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
      <nav aria-label="Secciones de administración" className="border-border mt-4 flex gap-1 border-b">
        {TABS.filter((tab) => isAdmin || !tab.adminOnly).map((tab) => {
          const active =
            tab.href === "/dashboard/admin" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active ? "border-primary text-primary" : "text-text-muted hover:text-text border-transparent"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
