"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Compass,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";

import { applyTheme, useTheme } from "@/lib/use-theme";
import ComingSoonLink from "@/components/ui/ComingSoonLink";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import UserAvatar from "@/components/ui/UserAvatar";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** La ruta todavía no existe: se muestra con <ComingSoonLink>. */
  comingSoon?: boolean;
}

/* TODO(campus): "Tutor IA" y "Logros" todavía no existen como rutas. Cuando
   se armen, se les saca el `comingSoon`. */
const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mis cursos", href: "/dashboard/mis-cursos", icon: BookOpen },
  { label: "Explorar", href: "/courses", icon: Compass },
  { label: "Tutor IA", href: "/dashboard/tutor", icon: Sparkles, comingSoon: true },
  { label: "Logros", href: "/dashboard/logros", icon: Trophy, comingSoon: true },
  { label: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];

const ROLE_LABEL = {
  student: "Estudiante",
  teacher: "Docente",
  admin: "Administrador",
} as const;

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
  const { user, logout } = useAuth();
  const { data } = useDashboardData();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* Primero se sale del dashboard y después se cierra la sesión: al revés,
     RequireAuth detecta la sesión vacía antes y manda a /login?redirect=
     en vez de a la landing. La sesión local se limpia aunque el back falle. */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    onClose();
    router.replace("/");
    await logout();
    // Respaldo: si el logout terminó antes que la navegación, RequireAuth
    // pudo haber ganado la carrera. Una navegación completa no la pierde.
    if (window.location.pathname !== "/") window.location.replace("/");
  };

  // Nombre, avatar y rol: reales (GET /users/me). Plan: real (GET /subscriptions/me).
  const name = user?.name?.trim() || "Invitado";
  const isPro = data?.plan === "PRO";
  const roleLabel = ROLE_LABEL[user?.role ?? "student"];
  // El panel de administración sólo aparece para quien lo puede usar.
  const canManage = user?.role === "admin" || user?.role === "teacher";
  const navItems = canManage
    ? [...NAV_ITEMS, { label: "Administración", href: "/dashboard/admin", icon: ShieldCheck }]
    : NAV_ITEMS;

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
            {navItems.map(({ label, href, icon: Icon, comingSoon }) => {
              if (comingSoon) {
                return (
                  <li key={href}>
                    <ComingSoonLink
                      label={label}
                      icon={Icon}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium"
                    />
                  </li>
                );
              }

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
          <UserAvatar name={name} avatarUrl={user?.avatarUrl} />
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

        {/* Cerrar sesión sin tener que volver a la landing. */}
        <div className="border-border border-t p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-text-secondary hover:text-danger hover:bg-surface-elevated flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <LogOut className="size-5" aria-hidden />
            )}
            {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>
    </>
  );
}
