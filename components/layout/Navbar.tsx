"use client";

import { useSyncExternalStore } from "react";
import { GraduationCap, Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const NAV_LINKS = [
  { label: "Cursos", href: "#cursos" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
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

  return (
    <header className="bg-surface/80 border-border fixed top-0 z-50 w-full border-b backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <a
          href="#"
          className="text-text flex cursor-pointer items-center gap-2 font-semibold transition-colors duration-150"
        >
          <GraduationCap className="text-primary size-6" aria-hidden />
          Campus
        </a>

        <ul className="hidden items-center gap-8 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-text-secondary hover:text-text cursor-pointer transition-colors duration-150"
              >
                {link.label}
              </a>
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

          <button
            type="button"
            className="text-text-secondary hover:text-text hidden cursor-pointer px-3 py-2 text-sm transition-colors duration-150 sm:block"
          >
            Iniciar sesión
          </button>

          <button
            type="button"
            className="bg-primary hover:bg-primary-hover cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
          >
            Registrarse
          </button>
        </div>
      </nav>
    </header>
  );
}
