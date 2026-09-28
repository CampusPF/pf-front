/* Modelo del tutor IA, ya adaptado — la forma cruda del back vive sólo
   dentro de services/ai-tutor/ai-tutor.service.ts (mismo criterio que
   services/certificates/: la conversación entera es chica, no amerita un
   adapter aparte como el de cursos).

   Cada conversación es de UNA lección puntual: el back exige `lessonId` al
   crearla (`CreateConversationDto`), no existe un chat "general". Fuera de
   una lección no hay con qué abrir una conversación real. */

export type AiTutorMessageRole = "user" | "assistant";

export interface AiTutorMessage {
  id: string;
  role: AiTutorMessageRole;
  content: string;
  createdAt: string;
}

/** Item de `GET /ai-tutor/conversations` (sin mensajes) o de una recién creada. */
export interface AiTutorConversation {
  id: string;
  lessonId: string;
  lessonTitle: string | null;
  createdAt: string;
}

/** `GET /ai-tutor/conversations/:id`: la conversación con su historial completo. */
export interface AiTutorConversationDetail extends AiTutorConversation {
  messages: AiTutorMessage[];
}

/** `GET /ai-tutor/usage/me`. `dailyLimit: null` = plan con uso ilimitado (Premium, docente, admin). */
export interface AiTutorUsage {
  messagesUsedToday: number;
  dailyLimit: number | null;
  remaining: number | null;
}
