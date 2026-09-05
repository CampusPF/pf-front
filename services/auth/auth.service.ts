import { API_URL, ApiError, apiFetch } from "@/services/api-client";
import {
  clearSession,
  saveSession,
} from "@/services/auth/token-storage";
import type {
  AuthSession,
  LoginPayload,
  RawAuthResponse,
  RegisterPayload,
} from "@/services/auth/auth.types";

function normalize(raw: RawAuthResponse): AuthSession {
  const token = raw.access_token ?? raw.accessToken ?? raw.token;

  if (!token) {
    throw new ApiError(
      "El servidor no devolvió un token de sesión.",
      500,
      raw,
    );
  }

  if (!raw.user) {
    throw new ApiError(
      "El servidor no devolvió los datos del usuario.",
      500,
      raw,
    );
  }

  return { token, user: raw.user };
}

/** POST /auth/register — crea la cuenta y deja la sesión guardada. */
export async function register(
  payload: RegisterPayload,
): Promise<AuthSession> {
  const raw = await apiFetch<RawAuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });

  const session = normalize(raw);
  saveSession(session.token, session.user);

  return session;
}

/** POST /auth/login */
export async function login(payload: LoginPayload): Promise<AuthSession> {
  const raw = await apiFetch<RawAuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });

  const session = normalize(raw);
  saveSession(session.token, session.user);

  return session;
}

/** POST /auth/logout — la sesión local se limpia pase lo que pase. */
export async function logout(): Promise<void> {
  try {
    await apiFetch<null>("/auth/logout", { method: "POST", auth: true });
  } finally {
    clearSession();
  }
}

/* GET /auth/google — es una redirección del navegador, no un fetch: el back
   necesita responder un 302 hacia Google y Google vuelve a
   /auth/google/callback. Por eso se navega con window.location. */
export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}

/* TODO(campus): falta cerrar el contrato de /auth/google/callback. Cuando el
   back redirija de vuelta al front hay que saber cómo manda el token —lo más
   común es ?token=... a una ruta tipo /auth/callback— y ahí creamos esa página
   para leerlo y llamar a saveSession(). */
