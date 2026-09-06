import type { User } from "@/services/auth/auth.types";

/* La sesión vive en localStorage porque el back devuelve el JWT en el body.
   Todos los accesos van envueltos en try/catch y con guard de SSR: en modo
   privado el storage tira, y en el server directamente no existe.

   TODO(back): el token ADEMÁS se duplica en una cookie no-HttpOnly (ver
   setCookie/deleteCookie más abajo) para que middleware.ts pueda leerlo en el
   edge y proteger rutas — localStorage es invisible ahí. Esto es un parche
   temporal: el día que /auth/login y /auth/register respondan con
   `Set-Cookie: HttpOnly`, borrar COOKIE_NAME/setCookie/deleteCookie y sus usos
   acá, agregar `credentials: "include"` en apiFetch, y habilitar CORS con
   `Access-Control-Allow-Credentials` en el back. */

const TOKEN_KEY = "campus.token";
const USER_KEY = "campus.user";
const COOKIE_NAME = "campus.token";
const COOKIE_MAX_AGE_DAYS = 7;

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

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

  try {
    setCookie(COOKIE_NAME, accessToken, COOKIE_MAX_AGE_DAYS);
  } catch {
    // Sin cookie no hay protección de rutas en el middleware, pero la sesión
    // sigue andando vía localStorage + Authorization header.
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

  try {
    deleteCookie(COOKIE_NAME);
  } catch {
    // Nada que limpiar si document.cookie no está disponible.
  }
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
