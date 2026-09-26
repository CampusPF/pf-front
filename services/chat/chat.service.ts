import {
  MOCK_COURSE_CHATS,
  MOCK_DIRECT_HISTORY,
  MOCK_GROUP_HISTORY,
  MOCK_INSTRUCTOR_GREETING,
  MOCK_UNREAD_SEED,
  pickCannedReply,
  toParticipant,
  type MockCourseChat,
  type SeedMessage,
} from "@/data/chat.mock";
import type { User } from "@/services/auth/auth.types";
import type {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ChatRole,
} from "@/types/chat.types";

/* Chat en vivo con el docente: sala grupal por curso + un directo por
   alumno.

   TODO(back): no hay endpoints todavía. Este archivo es el ÚNICO que se toca
   cuando existan: cada función pasa de leer/escribir el store de acá a un
   `apiFetch` (REST) o a un socket, según lo que se decida. `getMessages` ya
   se llama por polling desde ChatThread — es el lugar natural para cambiar
   por una suscripción en tiempo real sin tocar la UI.

   NEXT_PUBLIC_CHAT_SOURCE=mock enciende los mocks. Sin la variable (lo normal
   y lo que tiene que estar en producción) el chat no muestra nada: mejor
   ausente que con conversaciones inventadas delante de un usuario real. */
const USE_MOCK_CHAT = process.env.NEXT_PUBLIC_CHAT_SOURCE === "mock";

function fakeLatency(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function groupId(courseId: string): string {
  return `group-${courseId}`;
}

/** También sirve para el directo alumno↔docente: `otherId` es quien está del
    otro lado (el docente para un alumno, el alumno puntual para el docente). */
function directId(otherId: string): string {
  return `direct-${otherId}`;
}

/* ── Store en memoria (sólo del lado del cliente) ─────────────────────────
   Vive mientras dure la pestaña: no hay back que lo persista. Se arma una
   sola vez a partir de los mocks y después sólo se le agregan mensajes. */

interface ChatStore {
  messages: Map<string, ChatMessage[]>;
  unread: Map<string, number>;
}

let store: ChatStore | null = null;

function resolveAuthor(
  authorId: string,
  course: MockCourseChat,
): ChatParticipant {
  if (authorId === course.instructor.id) {
    return toParticipant(course.instructor, "teacher");
  }
  const student = course.students.find((s) => s.id === authorId);
  if (student) return toParticipant(student, "student");
  throw new Error(`Autor de mock desconocido: ${authorId}`);
}

function toMessage(conversationId: string, seed: SeedMessage, course: MockCourseChat): ChatMessage {
  return {
    id: `${conversationId}-seed-${seed.minutesAgo}-${seed.authorId}`,
    conversationId,
    author: resolveAuthor(seed.authorId, course),
    text: seed.text,
    sentAt: new Date(Date.now() - seed.minutesAgo * 60_000).toISOString(),
  };
}

function seedConversation(
  store: ChatStore,
  conversationId: string,
  history: SeedMessage[],
  course: MockCourseChat,
) {
  store.messages.set(
    conversationId,
    history.map((seed) => toMessage(conversationId, seed, course)),
  );
  store.unread.set(conversationId, MOCK_UNREAD_SEED[conversationId] ?? 0);
}

function buildStore(): ChatStore {
  const store: ChatStore = { messages: new Map(), unread: new Map() };

  for (const course of MOCK_COURSE_CHATS) {
    seedConversation(store, groupId(course.courseId), MOCK_GROUP_HISTORY[course.courseId] ?? [], course);

    // Directo del alumno REAL logueado con el docente (lo que ve un alumno):
    // arranca con un saludo del docente, nunca con un mensaje de otro alumno.
    const greeting = MOCK_INSTRUCTOR_GREETING[course.courseId];
    seedConversation(store, directId(course.instructor.id), greeting ? [greeting] : [], course);

    // Directos del docente con cada alumno de mentira (lo que ve el docente).
    for (const student of course.students) {
      seedConversation(store, directId(student.id), MOCK_DIRECT_HISTORY[student.id] ?? [], course);
    }
  }

  return store;
}

function ensureStore(): ChatStore {
  if (!store) store = buildStore();
  return store;
}

function sortedMessages(list: ChatMessage[] | undefined): ChatMessage[] {
  return [...(list ?? [])].sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt));
}

function lastMessageOf(list: ChatMessage[] | undefined): ChatConversation["lastMessage"] {
  const sorted = sortedMessages(list);
  if (sorted.length === 0) return null;
  const last = sorted[sorted.length - 1];
  return { text: last.text, sentAt: last.sentAt, authorName: last.author.name };
}

/** Quién está del otro lado de un chat directo, buscándolo por su id (ver `directId`). */
function findOtherParticipant(otherId: string): ChatParticipant | null {
  for (const course of MOCK_COURSE_CHATS) {
    if (course.instructor.id === otherId) return toParticipant(course.instructor, "teacher");
    const student = course.students.find((s) => s.id === otherId);
    if (student) return toParticipant(student, "student");
  }
  return null;
}

/** La parte "en vivo": unos segundos después de escribir en un directo,
    llega sola una respuesta canned de la otra persona. No aplica a la sala
    grupal (con varias voces de mentira contestando sería ruido, no demo). */
function scheduleCannedReply(conversationId: string, sentBy: ChatParticipant) {
  if (!conversationId.startsWith("direct-")) return;

  const otherId = conversationId.slice("direct-".length);
  const other = findOtherParticipant(otherId);
  if (!other || other.id === sentBy.id) return;

  const delayMs = 1500 + Math.random() * 1500;
  setTimeout(() => {
    const current = ensureStore();
    const reply: ChatMessage = {
      id: `${conversationId}-${Date.now()}-auto`,
      conversationId,
      author: other,
      text: pickCannedReply(other.role),
      sentAt: new Date().toISOString(),
    };
    current.messages.set(conversationId, [...(current.messages.get(conversationId) ?? []), reply]);
  }, delayMs);
}

/** Rol del usuario logueado como participante del chat, o `null` si el chat
    no es para ese rol (hoy sólo alumno y docente; el admin no cursa ni dicta). */
export function chatRoleFor(role: User["role"]): ChatRole | null {
  return role === "student" || role === "teacher" ? role : null;
}

/** `false` sin NEXT_PUBLIC_CHAT_SOURCE=mock: distingue "todavía no está
    disponible" de "no tenés conversaciones" en la pantalla. */
export function isChatAvailable(): boolean {
  return USE_MOCK_CHAT;
}

export function toCurrentParticipant(
  user: Pick<User, "id" | "name" | "avatarUrl">,
  role: ChatRole,
): ChatParticipant {
  return { id: user.id, name: user.name, role, avatarUrl: user.avatarUrl ?? null };
}

/**
 * Mis conversaciones: la sala grupal de cada curso, más un directo por
 * alumno (vista docente) o el directo con el/la docente (vista alumno).
 * Ordenadas por el mensaje más reciente.
 */
export async function getMyConversations(
  user: Pick<User, "id" | "name" | "avatarUrl">,
  role: ChatRole | null,
): Promise<ChatConversation[]> {
  if (!USE_MOCK_CHAT || !role) return [];
  await fakeLatency();

  const { messages, unread } = ensureStore();
  const isTeacher = role === "teacher";
  const conversations: ChatConversation[] = [];

  for (const course of MOCK_COURSE_CHATS) {
    const gId = groupId(course.courseId);
    conversations.push({
      id: gId,
      kind: "group",
      courseId: course.courseId,
      courseSlug: course.courseSlug,
      courseTitle: course.courseTitle,
      title: course.courseTitle,
      subtitle: "Sala del curso",
      avatarUrl: null,
      otherParticipant: null,
      lastMessage: lastMessageOf(messages.get(gId)),
      unreadCount: unread.get(gId) ?? 0,
    });

    if (isTeacher) {
      for (const student of course.students) {
        const dId = directId(student.id);
        conversations.push({
          id: dId,
          kind: "direct",
          courseId: course.courseId,
          courseSlug: course.courseSlug,
          courseTitle: course.courseTitle,
          title: student.name,
          subtitle: course.courseTitle,
          avatarUrl: student.avatarUrl,
          otherParticipant: toParticipant(student, "student"),
          lastMessage: lastMessageOf(messages.get(dId)),
          unreadCount: unread.get(dId) ?? 0,
        });
      }
    } else {
      const dId = directId(course.instructor.id);
      conversations.push({
        id: dId,
        kind: "direct",
        courseId: course.courseId,
        courseSlug: course.courseSlug,
        courseTitle: course.courseTitle,
        title: course.instructor.name,
        subtitle: course.courseTitle,
        avatarUrl: course.instructor.avatarUrl,
        otherParticipant: toParticipant(course.instructor, "teacher"),
        lastMessage: lastMessageOf(messages.get(dId)),
        unreadCount: unread.get(dId) ?? 0,
      });
    }
  }

  return conversations.sort((a, b) => {
    const at = a.lastMessage ? Date.parse(a.lastMessage.sentAt) : 0;
    const bt = b.lastMessage ? Date.parse(b.lastMessage.sentAt) : 0;
    return bt - at;
  });
}

/** Mensajes de una conversación, del más viejo al más nuevo. Pensada para
    pedirse por polling (ver ChatThread): es barata, no hace red todavía. */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  if (!USE_MOCK_CHAT) return [];
  const { messages } = ensureStore();
  return sortedMessages(messages.get(conversationId));
}

/** Se llama al abrir una conversación: la saca de "sin leer". */
export function markConversationRead(conversationId: string): void {
  if (!USE_MOCK_CHAT) return;
  ensureStore().unread.set(conversationId, 0);
}

/**
 * Manda un mensaje. En un chat directo, programa la respuesta de mentira que
 * le da vida a la demo (ver `scheduleCannedReply`); en la sala grupal no.
 */
export async function sendMessage(
  conversationId: string,
  author: ChatParticipant,
  text: string,
): Promise<ChatMessage> {
  if (!USE_MOCK_CHAT) throw new Error("El chat todavía no está disponible.");
  await fakeLatency(300);

  const { messages } = ensureStore();
  const message: ChatMessage = {
    id: `${conversationId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversationId,
    author,
    text,
    sentAt: new Date().toISOString(),
  };
  messages.set(conversationId, [...(messages.get(conversationId) ?? []), message]);

  scheduleCannedReply(conversationId, author);

  return message;
}
