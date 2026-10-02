/* Modelo del chat en vivo con el docente.

   pf-back sólo soporta "direct" (un alumno a solas con el docente del
   curso): no hay sala grupal en el back. "group" (la sala del curso, todos
   los inscriptos + el docente) sigue existiendo acá sólo para
   NEXT_PUBLIC_CHAT_SOURCE=mock — ver services/chat/chat.service.ts, que es
   el único que sabe la diferencia. Quién ve qué según el rol lo resuelve el
   service, no los componentes. */

/* Pares que acepta el back: alumno↔docente (con curso activo en común) y
   admin↔docente (soporte interno). Admin↔alumno no existe. */
export type ChatRole = "student" | "teacher" | "admin";

export interface ChatParticipant {
  id: string;
  name: string;
  role: ChatRole;
  avatarUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  author: ChatParticipant;
  text: string;
  /** ISO. */
  sentAt: string;
}

export type ChatConversationKind = "group" | "direct";

/**
 * Ya resuelta desde el punto de vista del usuario logueado: `title` y
 * `subtitle` cambian según quién mira (para un alumno, el directo muestra al
 * docente; para el docente, muestra al alumno). El componente no decide nada,
 * sólo pinta lo que el service ya armó — mismo criterio que `dashboard.view.ts`.
 */
export interface ChatConversation {
  id: string;
  kind: ChatConversationKind;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  /** Nombre del curso (grupal) o de la otra persona (directo). */
  title: string;
  /** "Sala del curso" (grupal) o el curso al que pertenece (directo, vista alumno/docente). */
  subtitle: string;
  avatarUrl?: string | null;
  /** Sólo en "direct": quién está del otro lado. */
  otherParticipant?: ChatParticipant | null;
  lastMessage: { text: string; sentAt: string; authorName: string } | null;
  unreadCount: number;
}
