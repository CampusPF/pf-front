import { clearSession } from "@/services/auth/token-storage";

/* Cuenta dada de baja (o suspendida) por un admin.

   El back responde 403 con `code: "account_disabled"` en todos los caminos:
   login, registro, Google (como `?error=account_disabled` en la URL) y
   cualquier request con una sesión que ya estaba abierta. Es un caso propio,
   no un error genérico: la persona tiene que ENTERARSE de que la dieron de
   baja y tener a dónde ir (Contacto), no ver "no existe una cuenta" en el
   login y "ya existe una cuenta" en el registro. */

export const ACCOUNT_DISABLED_CODE = "account_disabled";

/** ¿Es la respuesta de cuenta dada de baja? (status + payload de un ApiError). */
export function isAccountDisabledResponse(status: number, payload: unknown): boolean {
  return (
    status === 403 &&
    typeof payload === "object" &&
    payload !== null &&
    (payload as { code?: unknown }).code === ACCOUNT_DISABLED_CODE
  );
}

/* Sin importar ApiError a propósito: api-client importa este archivo, y
   importarlo de vuelta armaría una dependencia circular. */
export function isAccountDisabledError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { status, payload } = error as { status?: unknown; payload?: unknown };
  return typeof status === "number" && isAccountDisabledResponse(status, payload);
}

let redirecting = false;

/**
 * La sesión abierta pertenece a una cuenta que ya no está activa: se cierra y
 * se lleva a la persona al login con el aviso. Carga de página completa (no
 * router.push) a propósito: corta el socket del chat y cualquier estado en
 * memoria de la cuenta anterior, y evita que RequireAuth redirija primero al
 * login pelado, sin el aviso.
 */
export function handleAccountDisabled(): void {
  if (typeof window === "undefined" || redirecting) return;
  redirecting = true;
  clearSession();
  window.location.replace(`/login?error=${ACCOUNT_DISABLED_CODE}`);
}
