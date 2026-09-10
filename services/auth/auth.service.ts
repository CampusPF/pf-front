import { API_URL, ApiError, apiFetch } from "@/services/api-client";
import { clearSession, saveSession } from "@/services/auth/token-storage";
import type {
  AuthResponse,
  LoginPayload,
  RawAuthResponse,
  RegisterPayload,
  User,
} from "@/services/auth/auth.types";

/* Única puerta de entrada del token. De acá para arriba sólo existe
   `accessToken`; `access_token` no se lee en ningún otro archivo del front.

   TODO(back): el back devuelve `access_token` (snake_case) y el contrato dice
   `accessToken`. Cuando lo migre, sacar el fallback y el campo de RawAuthResponse. */
function normalizeAuthResponse(raw: RawAuthResponse): AuthResponse {
  const accessToken = raw.access_token ?? raw.accessToken;

  if (!accessToken) {
    throw new ApiError("El servidor no devolvió un token de sesión.", 500, raw);
  }

  if (!raw.user) {
    throw new ApiError(
      "El servidor no devolvió los datos del usuario.",
      500,
      raw,
    );
  }

  return { accessToken, user: raw.user };
}

/** POST /auth/register — crea la cuenta y deja la sesión guardada. */
export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const raw = await apiFetch<RawAuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });

  const session = normalizeAuthResponse(raw);
  saveSession(session.accessToken, session.user);

  return session;
}

/** POST /auth/login */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const raw = await apiFetch<RawAuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });

  const session = normalizeAuthResponse(raw);
  saveSession(session.accessToken, session.user);

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
   /auth/google/callback. Por eso se navega con window.location.

   `flow` le dice al back desde qué pantalla arrancó el usuario (viaja por el
   `state` de OAuth): en "login" Google no crea cuentas, en "register" sí crea
   si el email no existe y rebota si ya existe. El back devuelve al usuario a
   /login o /register con ?error= según el caso (ver services/auth/oauth-error). */
export function getGoogleAuthUrl(flow: "login" | "register" = "login"): string {
  return `${API_URL}/auth/google?flow=${flow}`;
}

/** GET /users/me — trae el usuario autenticado a partir del token guardado.
    Se usa para el login con Google (donde sólo llega el token, sin user) y
    para rehidratar la sesión al recargar la página. */
export async function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>("/users/me", { auth: true });
}

/* Cierra el login que empezó el back con Google. El back redirige a
   /auth/callback?token=... con SÓLO el token; acá lo guardamos para que el
   apiFetch de /users/me pueda mandar el Bearer, traemos el user y volvemos a
   guardar la sesión ya completa. */
export async function completeGoogleLogin(
  accessToken: string,
): Promise<AuthResponse> {
  // Paso 1: guardar el token pelado para que fetchCurrentUser mande el Bearer.
  saveSession(accessToken, null);

  try {
    const user = await fetchCurrentUser();
    // Paso 2: ahora sí, sesión completa con los datos del usuario.
    saveSession(accessToken, user);
    return { accessToken, user };
  } catch (error) {
    // Si /users/me falla, no dejamos una sesión a medias (token sin user).
    clearSession();
    throw error;
  }
}
