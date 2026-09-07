"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleUser,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import Link from 'next/link';

import { useAuth } from "@/components/auth/AuthProvider";

type Theme = "light" | "dark";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Cursos", href: "/courses" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Precios", href: "/#precios" },
];

/* ── Store del tema ────────────────────────────────────────────────
   El tema no vive en React: vive en <html data-theme> (lo escribe el
   script inline del layout antes del primer paint) + localStorage + la
   preferencia del SO. Por eso se lee con useSyncExternalStore en vez de
   useState/useEffect, que además dispara render en cascada. */

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  // `storage` mantiene sincronizadas las demás pestañas abiertas.
  media.addEventListener("change", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    media.removeEventListener("change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// En SSR el tema es desconocido: devolver null hace que el botón renderice
// un hueco del mismo tamaño y evita mismatch de hidratación.
function getServerSnapshot(): null {
  return null;
}

function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Modo privado / storage bloqueado: el tema sigue aplicando en esta sesión.
  }
  listeners.forEach((listener) => listener());
}

export default function Navbar() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cierra el dropdown de usuario al clickear afuera.
  useEffect(() => {
    if (!isUserMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  // El menú mobile no tiene sentido en desktop: si la ventana crece, se cierra solo.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeIfDesktop = () => {
      if (media.matches) setIsMobileMenuOpen(false);
    };
    media.addEventListener("change", closeIfDesktop);
    return () => media.removeEventListener("change", closeIfDesktop);
  }, []);

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    closeMenus();
    await logout();
    router.push("/");
  };

  return (
    <header className="bg-surface/80 border-border fixed top-0 z-50 w-full border-b backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          onClick={closeMenus}
          className="text-text flex cursor-pointer items-center gap-2 font-semibold transition-colors duration-150"
        >
          <GraduationCap className="text-primary size-6" aria-hidden />
          Campus
        </Link>

        <ul className="hidden items-center gap-8 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-text-secondary hover:text-text cursor-pointer transition-colors duration-150"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
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

          {/* Auth desktop: dropdown de usuario o login/registro */}
          <div className="hidden items-center md:flex">
            {isLoading ? null : isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Menú de cuenta"
                  className="text-text-secondary hover:text-text hover:bg-surface-elevated flex cursor-pointer items-center gap-1 rounded-lg p-2 transition-colors duration-150"
                >
                  <CircleUser className="size-5.5" aria-hidden />
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-150 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="bg-surface border-border absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border shadow-lg"
                  >
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={closeMenus}
                      className="text-text hover:bg-surface-elevated flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150"
                    >
                      <LayoutDashboard className="size-4" aria-hidden />
                      Mi dashboard
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="text-danger hover:bg-surface-elevated flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors duration-150"
                    >
                      <LogOut className="size-4" aria-hidden />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-text-secondary hover:text-text cursor-pointer px-3 py-2 text-sm transition-colors duration-150"
                >
                  Iniciar sesión
                </Link>

                <Link
                  href="/register"
                  className="bg-primary hover:bg-primary-hover cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Hamburguesa: sólo mobile/tablet */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150 md:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="border-border bg-surface border-t px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-1 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenus}
                  className="text-text-secondary hover:text-text block cursor-pointer rounded-lg px-2 py-2.5 transition-colors duration-150"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-border mt-2 flex flex-col gap-1 border-t pt-2">
            {isLoading ? null : isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMenus}
                  className="text-text hover:bg-surface-elevated flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm transition-colors duration-150"
                >
                  <LayoutDashboard className="size-4" aria-hidden />
                  Mi dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-danger hover:bg-surface-elevated flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm transition-colors duration-150"
                >
                  <LogOut className="size-4" aria-hidden />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="text-text-secondary hover:text-text cursor-pointer rounded-lg px-2 py-2.5 text-sm transition-colors duration-150"
                >
                  Iniciar sesión
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenus}
                  className="bg-primary hover:bg-primary-hover mt-1 cursor-pointer rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition-colors duration-150"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
