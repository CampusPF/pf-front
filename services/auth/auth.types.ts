/* ── Contrato ─────────────────────────────────────────────────────
   Cómo DEBERÍA responder el back. Es lo único que el resto de la app conoce. */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

/** Sesión ya normalizada. Nadie fuera de este módulo lee `access_token`. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

/* TODO(campus): confirmar los nombres de campo con el back. Si el DTO de
   registro espera `fullName` en vez de `name`, se cambia acá y en el form. */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/* ── Lo que el back devuelve HOY ──────────────────────────────────
   TODO(back): el login/register devuelven el token como `access_token`
   (snake_case). El contrato dice `accessToken`. Aceptamos las dos y
   normalizamos en `normalizeAuthResponse`; cuando el back pase a camelCase se
   borra `access_token` de acá y el fallback del service. */
export interface RawAuthResponse {
  user?: User;
  access_token?: string;
  accessToken?: string;
}
