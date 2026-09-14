import { ApiError } from "@/services/api-client";
import { backendMessageOr } from "@/services/backend-message";

/** Mensaje para errores de las pantallas de administración. */
export function adminErrorMessage(error: unknown, fallback = "Algo salió mal. Probá de nuevo."): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      // Un teacher ya puede escribir sobre SUS cursos (ver assertCourseOwner
      // en pf-back); esto sólo dispara si el curso/módulo/lección es de otro
      // instructor, o (rarísimo) un rol sin acceso llega igual al pedido.
      return backendMessageOr(error, "No tenés permisos para esta acción.");
    }
    if (error.status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    return backendMessageOr(error, fallback);
  }
  return error instanceof Error ? error.message : fallback;
}
