import { apiFetch, ApiError, API_URL } from "@/services/api-client";
import { getToken } from "@/services/auth/token-storage";
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
 * `GET /ai-tutor/lessons/:lessonId/conversation` — mi última conversación de
 * esta lección CON su historial, o `null` si nunca le pregunté nada acá. El
 * back también valida que tenga acceso a la lección (403 si no).
 */
export async function findConversationForLesson(
  lessonId: string,
  signal?: AbortSignal,
): Promise<AiTutorConversationDetail | null> {
  const raw = await apiFetch<{ conversation: RawConversation | null }>(
    `/ai-tutor/lessons/${encodeURIComponent(lessonId)}/conversation`,
    { auth: true, signal },
  );
  if (!raw.conversation) return null;
  return {
    ...toConversation(raw.conversation),
    messages: (raw.conversation.messages ?? []).map(toMessage),
  };
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

/** Acciones rápidas ("burbujas"): el back arma el pedido real a la IA. */
export type AiTutorQuickAction =
  | "SIMPLER_EXAMPLES"
  | "SUMMARIZE"
  | "PRACTICE_QUESTIONS"
  | "EXPLAIN_AGAIN";

export type AiTutorMessageInput = { content: string } | { action: AiTutorQuickAction };

/** Código del back cuando el plan Free se queda sin mensajes del día. */
export const AI_DAILY_LIMIT_CODE = "AI_DAILY_LIMIT_REACHED";

/**
 * `POST /ai-tutor/conversations/:id/messages` — manda el mensaje del alumno
 * y la respuesta del tutor llega en STREAMING (Server-Sent Events): cada
 * pedacito de texto se entrega a `onToken` apenas llega, para ir mostrándolo.
 *
 * No usa `apiFetch` porque éste lee el body entero como JSON; acá hay que
 * leerlo de a poco. Los errores previos al stream (403 sin acceso, 429 por
 * límite diario con `code: AI_DAILY_LIMIT_REACHED` o por ráfaga, 503 sin IA)
 * llegan como JSON normal y se tiran como ApiError, igual que en apiFetch.
 */
export async function streamMessage(
  conversationId: string,
  input: AiTutorMessageInput,
  onToken: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ messageId: string | null }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(
      `${API_URL}/ai-tutor/conversations/${encodeURIComponent(conversationId)}/messages`,
      { method: "POST", headers, body: JSON.stringify(input), credentials: "include", signal },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError("No pudimos conectarnos con el servidor. Revisá que el back esté levantado.", 0, error);
  }

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    const message = (payload as { message?: string } | null)?.message;
    throw new ApiError(message ?? `La petición falló (${response.status}).`, response.status, payload);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let messageId: string | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Cada evento termina en una línea en blanco; el último puede estar a medias.
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const type = event.match(/^event: (.+)$/m)?.[1];
      const data = event.match(/^data: (.+)$/m)?.[1];
      if (!type || !data) continue;
      const parsed = JSON.parse(data);

      if (type === "token") onToken(parsed.text);
      else if (type === "done") messageId = parsed.messageId;
      else if (type === "error") throw new ApiError(parsed.message, 502, parsed);
    }
  }

  return { messageId };
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

/** true si el error es "te quedaste sin mensajes gratis hoy". */
export function isDailyLimitError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.payload as { code?: string } | null)?.code === AI_DAILY_LIMIT_CODE
  );
}

/**
 * Hay dos 429: el del límite diario (`code: AI_DAILY_LIMIT_REACHED`, con el
 * texto ya en español) y el del ThrottlerGuard por ráfaga, con un texto
 * técnico en inglés ("ThrottlerException..."). El resto cae al mismo criterio
 * que `adminErrorMessage`/`uploadErrorMessage`.
 */
export function aiTutorErrorMessage(error: unknown): string {
  if (isDailyLimitError(error)) {
    return (error as ApiError).message;
  }
  if (error instanceof ApiError && error.status === 429) {
    return "Mandaste muchos mensajes muy rápido. Esperá un momento y probá de nuevo.";
  }
  return backendMessageOr(error, "No pudimos enviar tu mensaje. Probá de nuevo.");
}
