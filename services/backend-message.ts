import { ApiError } from "@/services/api-client";

/* Mensajes que Nest devuelve por defecto cuando una excepción no lleva texto
   propio (`ForbiddenException()`, `UnauthorizedException()`, sin argumentos)
   — en inglés, y sin sentido para quien usa la app. El caso real: RolesGuard
   deniega con `ForbiddenException()` a secas, así que un 403 "genérico" (no
   uno de los nuestros, que sí llevan mensaje) mostraba "Forbidden resource"
   tal cual en pantalla. Estos se cambian por un texto en español; el resto
   del mensaje del back (los nuestros, ya en español y sin detalles internos,
   como "Este curso no es tuyo: no podés editarlo.") se muestra tal cual. */
const RAW_BACKEND_MESSAGES = new Set([
  "Forbidden resource",
  "Unauthorized",
  "Internal server error",
  "Not Found",
  "Bad Request",
]);

function isDisplayable(message: string): boolean {
  const trimmed = message.trim();
  return trimmed.length > 0 && !RAW_BACKEND_MESSAGES.has(trimmed);
}

/** El mensaje del back si es presentable, si no el `fallback` en español. */
export function backendMessageOr(error: unknown, fallback: string): string {
  if (error instanceof ApiError && isDisplayable(error.message)) return error.message;
  return fallback;
}
