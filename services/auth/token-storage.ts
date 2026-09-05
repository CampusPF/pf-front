import type { AuthUser } from "@/services/auth/auth.types";

/* La sesión vive en localStorage porque el back devuelve el JWT en el body.
   Todos los accesos van envueltos en try/catch y con guard de SSR: en modo
   privado el storage tira, y en el server directamente no existe. */

const TOKEN_KEY = "campus.token";
const USER_KEY = "campus.user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser | null) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage bloqueado: la sesión igual sirve mientras dure la pestaña.
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nada que limpiar si el storage no está disponible.
  }
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
