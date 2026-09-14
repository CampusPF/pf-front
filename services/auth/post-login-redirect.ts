/* A dónde ir después de iniciar sesión o registrarse. Un solo lugar para los
   tres caminos (formulario de login, de registro y Google), que antes no
   coincidían: el formulario mandaba a /courses y Google a /dashboard, y Google
   además perdía el ?redirect= (volvías al dashboard aunque vinieras de un
   curso).

   Google sale del sitio (front → back → Google → back → /auth/callback), así
   que el redirect no puede viajar en la URL: se guarda en sessionStorage
   antes de salir y se consume en el callback. */

export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

const STORAGE_KEY = "campus.postLoginRedirect";

/**
 * Sólo rutas internas. `startsWith("/")` no alcanza: "//otro-sitio.com" y
 * "/\otro-sitio.com" también empiezan con "/" y el navegador los resuelve a
 * otro dominio (open redirect).
 */
export function safeRedirect(target: string | null | undefined): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }
  return target;
}

/** Antes de mandar al usuario a Google: recordar a dónde volver. */
export function rememberRedirect(target: string | null | undefined): void {
  try {
    if (target) sessionStorage.setItem(STORAGE_KEY, target);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin storage (modo privado estricto): se cae al destino por defecto.
  }
}

/** En /auth/callback: el redirect guardado (y se borra), ya validado. */
export function consumeRememberedRedirect(): string {
  try {
    const target = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return safeRedirect(target);
  } catch {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }
}
