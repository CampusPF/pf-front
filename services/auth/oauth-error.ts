/* Motivos con los que el back puede rebotar el login/registro con Google.
   Llegan como `?error=` en la URL de /login o /register (ver el redirect de
   auth.controller.ts → googleAuthCallback en el back). */

const MESSAGES: Record<string, string> = {
  // Entró por "Continuar con Google" desde /login pero no tiene cuenta.
  not_registered:
    "No existe una cuenta con ese email. Creá tu cuenta antes de entrar con Google.",
  // Entró por "Continuar con Google" desde /register pero el email ya existe.
  already_registered:
    "Ya existe una cuenta con ese email. Iniciá sesión en lugar de registrarte.",
};

const FALLBACK = "No pudimos completar el inicio con Google. Probá de nuevo.";

/**
 * Traduce el `?error=` de la URL a un mensaje para el usuario.
 * Devuelve `null` cuando no hay error (uso normal de la pantalla).
 */
export function googleOAuthError(code: string | null | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? FALLBACK;
}
