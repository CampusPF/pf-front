import { apiFetch, ApiError } from "@/services/api-client";
import { backendMessageOr } from "@/services/backend-message";
import type {
  AiTutorConversation,
  AiTutorConversationDetail,
  AiTutorMessage,
  AiTutorUsage,
} from "@/types/ai-tutor.types";

/* Tutor IA: una conversación por lección (el back exige `lessonId` al
   crearla — no hay chat "general"), con corrección server-side del límite
   diario de mensajes del plan Free.

   Todas las rutas van con `auth: true`: el back identifica al usuario por el
   token (`@CurrentUser('id')`), así que ninguna función de acá recibe un
   `userId` a mano. */

interface RawMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** `lesson` sólo viene con `relations: { lesson: true }` (list) o al crear;
    `messages` sólo en el detalle (`findOne`). */
interface RawConversation {
  id: string;
  lesson?: { id: string; title: string } | null;
  createdAt: string;
  messages?: RawMessage[];
}

function toMessage(raw: RawMessage): AiTutorMessage {
  return { id: raw.id, role: raw.role, content: raw.content, createdAt: raw.createdAt };
}

function toConversation(raw: RawConversation): AiTutorConversation {
  return {
    id: raw.id,
    lessonId: raw.lesson?.id ?? "",
    lessonTitle: raw.lesson?.title ?? null,
    createdAt: raw.createdAt,
  };
}

/** `GET /ai-tutor/conversations` — todas las mías, la más nueva primero. */
export async function getMyConversations(signal?: AbortSignal): Promise<AiTutorConversation[]> {
  const raw = await apiFetch<RawConversation[]>("/ai-tutor/conversations", { auth: true, signal });
  return raw.map(toConversation);
}

/**
 * Mi conversación de esta lección si ya existe, o `null`. El drawer la usa
 * para retomar el historial en vez de arrancar una charla nueva cada vez que
 * se abre — el back no tiene un "buscar por lessonId", así que se filtra acá
 * sobre el listado completo (es corto: una fila por lección visitada).
 */
export async function findConversationForLesson(
  lessonId: string,
  signal?: AbortSignal,
): Promise<AiTutorConversation | null> {
  const conversations = await getMyConversations(signal);
  return conversations.find((c) => c.lessonId === lessonId) ?? null;
}

/** `GET /ai-tutor/conversations/:id` — con el historial completo, ya ordenado por el back. */
export async function getConversation(
  id: string,
  signal?: AbortSignal,
): Promise<AiTutorConversationDetail> {
  const raw = await apiFetch<RawConversation>(`/ai-tutor/conversations/${encodeURIComponent(id)}`, {
    auth: true,
    signal,
  });
  return { ...toConversation(raw), messages: (raw.messages ?? []).map(toMessage) };
}

/** `POST /ai-tutor/conversations` — una por lección; se crea recién con el primer mensaje, no al abrir el drawer. */
export async function createConversation(lessonId: string): Promise<AiTutorConversation> {
  const raw = await apiFetch<RawConversation>("/ai-tutor/conversations", {
    method: "POST",
    body: { lessonId },
    auth: true,
  });
  return toConversation(raw);
}

/**
 * `POST /ai-tutor/conversations/:id/messages` — manda el mensaje del alumno
 * y devuelve, en la misma respuesta, la del tutor ya generada (no hay
 * streaming: la UI espera esta promesa entera).
 *
 * Puede fallar con 400 (límite diario del plan Free alcanzado — el mensaje ya
 * viene listo para mostrar) o 429 (demasiados mensajes seguidos). Usar
 * `aiTutorErrorMessage` para el texto que se le muestra al usuario.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<{ userMessage: AiTutorMessage; assistantMessage: AiTutorMessage }> {
  const raw = await apiFetch<{ userMessage: RawMessage; assistantMessage: RawMessage }>(
    `/ai-tutor/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "POST", body: { content }, auth: true },
  );
  return { userMessage: toMessage(raw.userMessage), assistantMessage: toMessage(raw.assistantMessage) };
}

/** `DELETE /ai-tutor/conversations/:id` — el back valida que sea mía. */
export function deleteConversation(id: string): Promise<void> {
  return apiFetch<void>(`/ai-tutor/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

/** `GET /ai-tutor/usage/me` — para mostrar "te quedan N mensajes hoy" en el plan Free. */
export function getUsage(signal?: AbortSignal): Promise<AiTutorUsage> {
  return apiFetch<AiTutorUsage>("/ai-tutor/usage/me", { auth: true, signal });
}

/**
 * El 429 lo tira el ThrottlerGuard con un texto técnico en inglés
 * ("ThrottlerException..."); el 400 del límite diario ya lo escribe
 * AiTutorService en español y se muestra tal cual (`backendMessageOr` lo deja
 * pasar). El resto cae al mismo criterio que `adminErrorMessage`/`uploadErrorMessage`.
 */
export function aiTutorErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) {
    return "Mandaste muchos mensajes muy rápido. Esperá un momento y probá de nuevo.";
  }
  return backendMessageOr(error, "No pudimos enviar tu mensaje. Probá de nuevo.");
}
