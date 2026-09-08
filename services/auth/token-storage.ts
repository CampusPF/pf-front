import type { User } from "@/services/auth/auth.types";

/* La sesión vive en localStorage porque el back devuelve el JWT en el body y
   así viaja como Authorization: Bearer en cada request autenticado. Todos
   los accesos van envueltos en try/catch y con guard de SSR: en modo
   privado el storage tira, y en el server directamente no existe.

   El back TAMBIÉN setea una cookie HttpOnly `campus.token` (ver
   apiFetch → credentials: "include"), pero es un canal aparte que ni
   leemos ni escribimos desde acá — JS no puede tocar una cookie HttpOnly,
   y de todos modos front y back son dominios distintos en producción, así
   que esa cookie no le sirve a Next para proteger rutas en el server (ver
   components/auth/RequireAuth.tsx y RedirectIfAuthenticated.tsx, que hacen
   ese trabajo del lado del cliente en base a este localStorage). */

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

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveSession(accessToken: string, user: User | null) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOKEN_KEY, accessToken);
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
