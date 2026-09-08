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

/* Contrato confirmado contra pf-back/src/auth/dto/register.dto.ts — todos los
   campos salvo address/city/country son obligatorios ahí. birthDate va en
   ISO "YYYY-MM-DD" (lo que devuelve un <input type="date"> nativo) y phone
   con código de país en formato internacional (+549...). */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
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
