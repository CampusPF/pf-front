import { ApiError } from "@/services/api-client";

/** Mensaje para errores de las pantallas de administración. */
export function adminErrorMessage(error: unknown, fallback = "Algo salió mal. Probá de nuevo."): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      // TODO(back): el teacher todavía no tiene permisos de escritura.
      return "No tenés permisos para esta acción. Si sos docente, el back todavía no habilitó la edición de cursos para tu rol.";
    }
    if (error.status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}
