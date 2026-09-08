"use client";

import { useSyncExternalStore } from "react";

/* Store del tema compartido (mismo mecanismo que usa el Navbar).
   El tema no vive en React: vive en <html data-theme> + localStorage + la
   preferencia del SO. Se lee con useSyncExternalStore para no disparar renders
   en cascada y mantenerse en sync entre el Navbar y el sidebar del dashboard. */

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
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

// En SSR el tema es desconocido: null hace que el consumidor renderice un hueco
// del mismo tamaño y evita mismatch de hidratación.
function getServerSnapshot(): null {
  return null;
}

export function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Modo privado / storage bloqueado: el tema sigue aplicando en esta sesión.
  }
  listeners.forEach((listener) => listener());
}

/** Devuelve el tema actual ("light" | "dark") o null durante SSR/pre-hidratación. */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
