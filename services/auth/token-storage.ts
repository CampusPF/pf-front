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

/* Qué se cachea del usuario, y por qué sólo esto.

   `campus.user` existe para pintar el chrome (nombre, avatar, rol, y el id
   para filtrar "mis cursos" del docente) sin esperar a GET /users/me. Nada
   más que eso lo lee, así que nada más que eso se guarda.

   Antes se persistía el objeto ENTERO de /users/me, que además trae datos
   personales (teléfono, dirección, ciudad, país, fecha de nacimiento) y
   metadatos de la cuenta. Quedaban en el disco del navegador sin que
   ninguna pantalla los usara desde acá: la de configuración los vuelve a
   pedir al back igual.

   El email y el rol no se ocultan por esconderlos: ya viajan DENTRO del JWT
   (payload { sub, email, role }), que está en la clave de al lado y se
   decodifica con un base64. El email se guarda porque no cuesta nada; los
   datos personales se van porque sí sumaban. */
type StoredUser = Pick<User, "id" | "name" | "email" | "avatarUrl" | "role">;

function toStoredUser(user: User): StoredUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
  };
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
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(toStoredUser(user)));
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
