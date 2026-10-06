"use client";

import { useSyncExternalStore } from "react";

/* Sidebar del dashboard colapsado (sólo íconos) en desktop. Mismo mecanismo
   que use-theme: la preferencia vive en localStorage y se lee con
   useSyncExternalStore, así sobrevive a recargas y no hay mismatch de
   hidratación (en SSR siempre se renderiza expandido). */

const STORAGE_KEY = "dashboard-sidebar-collapsed";

const listeners = new Set<() => void>();

// Respaldo en memoria por si localStorage está bloqueado (modo privado): el
// toggle sigue funcionando en la sesión, sólo que no se recuerda.
let memoryValue = false;

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? memoryValue : stored === "1";
  } catch {
    return memoryValue;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function setSidebarCollapsed(next: boolean) {
  memoryValue = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Storage bloqueado: queda sólo memoryValue.
  }
  listeners.forEach((listener) => listener());
}

export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
