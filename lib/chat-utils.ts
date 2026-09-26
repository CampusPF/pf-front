/* Formato de fechas para el chat: nada de esto se reutiliza fuera de acá
   (a diferencia de course-utils, que sí es transversal), así que vive
   separado en vez de sumarle ramas a formatDuration y compañía. */

/** "ahora" · "hace 5 min" · "hace 2 h" · "ayer" · "12 sept", para la lista de conversaciones. */
export function formatRelativeTime(iso: string): string {
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);

  if (diffMinutes < 1) return "ahora";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;

  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;

  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/** "14:32", la hora debajo de cada burbuja de mensaje. */
export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
