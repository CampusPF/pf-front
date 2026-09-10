import { apiFetch } from "@/services/api-client";
import type { User } from "@/services/auth/auth.types";

/* Perfil propio del usuario logueado. Todo requiere el Bearer.

   El back separa esto del CRUD de administración a propósito: `PATCH /users/me`
   acepta sólo datos personales, mientras que `PATCH /users/:id` (admin) es el
   que puede tocar `role`. Mandar `email` o `role` acá devuelve 400 — el
   ValidationPipe del back corre con `forbidNonWhitelisted`. */

/** Campos que `PATCH /users/me` acepta. El email NO se puede cambiar. */
export interface UpdateProfilePayload {
  name?: string;
  /** ISO "YYYY-MM-DD". */
  birthDate?: string;
  /** Formato internacional, con "+" y código de país. */
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface SetPasswordPayload {
  /** Obligatoria salvo que la cuenta no tenga contraseña (alta con Google). */
  currentPassword?: string;
  password: string;
  confirmPassword: string;
}

/** `GET /users/me` — la ficha completa, con `hasPassword` e `isGoogleAccount`. */
export function getMyProfile(signal?: AbortSignal) {
  return apiFetch<User>("/users/me", { auth: true, signal });
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiFetch<User>("/users/me", {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

/**
 * `PATCH /users/me/password`. Un solo endpoint para los dos casos: si la cuenta
 * ya tiene contraseña hay que mandar `currentPassword`, y si se creó con Google
 * se omite (es un alta, no un cambio).
 */
export function setPassword(payload: SetPasswordPayload) {
  return apiFetch<{ message: string }>("/users/me/password", {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}
