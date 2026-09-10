"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Compass,
  GraduationCap,
  LayoutDashboard,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Trophy,
  X,
} from "lucide-react";

import { applyTheme, useTheme } from "@/lib/use-theme";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";

/* TODO(campus): "Mis cursos", "Tutor IA" y "Logros" todavía no existen como
   rutas. Se van creando a medida que se arman las vistas del área logueada
   ("Configuración" ya está). */
const NAV_ITEMS = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mis cursos", href: "/dashboard/mis-cursos", icon: BookOpen },
  { label: "Explorar", href: "/courses", icon: Compass },
  { label: "Tutor IA", href: "#", icon: Sparkles },
  { label: "Logros", href: "/dashboard/logros", icon: Trophy },
  { label: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const theme = useTheme();
  const { user } = useAuth();
  const { data } = useDashboardData();

  // Nombre e inicial: reales (GET /users/me). Plan: real (GET /subscriptions/me).
  // El rol sigue fijo — /users/me trae role pero el tipo User del front no lo
  // modela todavía y hoy son todos "student". TODO(back).
  const name = user?.name?.trim() || "Invitado";
  const isPro = data?.plan === "PRO";
  const roleLabel = "Estudiante";

  return (
    <>
      {/* Backdrop del drawer mobile */}
      {open && (
        <div
          className="bg-text/40 fixed inset-0 z-40 lg:hidden"
          aria-hidden
          onClick={onClose}
        />
      )}

      <aside
        className={`bg-surface border-border fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo + cerrar (mobile) */}
        <div className="border-border flex h-16 items-center justify-between gap-2 border-b px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="text-text flex items-center gap-2 font-semibold"
          >
            <GraduationCap className="text-primary size-6" aria-hidden />
            Campus
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-1.5 transition-colors duration-150 lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Volver al sitio público: el resto de la navegación es interna al
            dashboard, esta es la única salida hacia la landing. */}
        <div className="border-border border-b p-3">
          <Link
            href="/"
            onClick={onClose}
            className="text-text-secondary hover:text-text hover:bg-surface-elevated flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150"
          >
            <ArrowLeft className="size-5" aria-hidden />
            Volver al inicio
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                      active
                        ? "bg-primary-subtle text-primary"
                        : "text-text-secondary hover:text-text hover:bg-surface-elevated"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Usuario + toggle de tema */}
        <div className="border-border flex items-center gap-3 border-t p-4">
          <span
            className="bg-primary-solid flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            aria-hidden
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-text flex items-center gap-1.5 text-sm font-medium">
              <span className="truncate">{name}</span>
              {isPro && (
                <span className="bg-accent-subtle text-accent rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                  PRO
                </span>
              )}
            </p>
            <p className="text-text-muted truncate text-xs">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
            aria-label={
              theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"
            }
            className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150"
          >
            {theme === null ? (
              <span className="block size-4.5" />
            ) : theme === "dark" ? (
              <Sun className="size-4.5" aria-hidden />
            ) : (
              <Moon className="size-4.5" aria-hidden />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
