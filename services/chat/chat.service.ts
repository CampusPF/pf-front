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
import { apiFetch } from "@/services/api-client";
import { backendMessageOr } from "@/services/backend-message";
import { getChatSocket, onNewMessage } from "@/services/chat/chat.socket";
import type { User } from "@/services/auth/auth.types";
import type {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ChatRole,
} from "@/types/chat.types";

/* Chat en vivo con el docente: un directo por alumno↔docente.

   pf-back sólo soporta mensajes directos (tabla `messages`, namespace de
   socket '/chat'): no hay sala grupal por curso, así que ese modo quedó sólo
   para los mocks (ver "kind: group" en @/types/chat.types).

   NEXT_PUBLIC_CHAT_SOURCE=mock sigue disponible para trabajar la UI sin el
   back (útil para diseño/demo); sin la variable (lo normal, y lo que tiene
   que estar en producción) todo sale de GET /chat/contacts,
   GET /chat/:otherUserId/messages y el socket del namespace '/chat'. */
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

/** Inversa de `directId`: de un id de conversación directa, el id de la otra
    persona. Lo usan tanto el modo real (arma la URL/el payload del socket)
    como el mock (`scheduleCannedReply`). */
function otherIdOf(conversationId: string): string {
  return conversationId.slice("direct-".length);
}

/* ── Mock: store en memoria (sólo del lado del cliente) ───────────────────
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
    llega sola una respuesta canned de la otra persona. */
function scheduleCannedReply(conversationId: string, sentBy: ChatParticipant) {
  const otherId = otherIdOf(conversationId);
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

async function getMockConversations(role: ChatRole): Promise<ChatConversation[]> {
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

async function getMockMessages(conversationId: string): Promise<ChatMessage[]> {
  const { messages } = ensureStore();
  return sortedMessages(messages.get(conversationId));
}

function markMockConversationRead(conversationId: string): void {
  ensureStore().unread.set(conversationId, 0);
}

async function sendMockMessage(
  conversationId: string,
  author: ChatParticipant,
  text: string,
): Promise<ChatMessage> {
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

/* ── Real: contra pf-back (GET /chat/contacts, GET /chat/:id/messages,
   PATCH /chat/:id/read y el socket del namespace '/chat') ─────────────── */

/** Forma cruda de `GET /chat/contacts` (ver ChatContactDto en pf-back). */
interface RawChatContact {
  user: { id: string; name: string; avatarUrl: string | null; role: ChatRole };
  courses: { id: string; slug: string; title: string }[];
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
}

/** Forma cruda de un mensaje (entidad `Message` serializada): la misma tanto
    en `GET /chat/:otherUserId/messages` como en el evento `message:new`. */
export interface RawChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

function isRawChatMessage(value: unknown): value is RawChatMessage {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.senderId === "string" &&
    typeof record.receiverId === "string" &&
    typeof record.content === "string"
  );
}

function toConversation(contact: RawChatContact, me: Pick<User, "id" | "name">): ChatConversation {
  const [firstCourse] = contact.courses;
  return {
    id: directId(contact.user.id),
    kind: "direct",
    courseId: firstCourse?.id ?? "",
    courseSlug: firstCourse?.slug ?? "",
    courseTitle: firstCourse?.title ?? "",
    title: contact.user.name,
    subtitle: contact.courses.map((c) => c.title).join(" · ") || "Sin curso activo en común",
    avatarUrl: contact.user.avatarUrl,
    otherParticipant: {
      id: contact.user.id,
      name: contact.user.name,
      role: contact.user.role,
      avatarUrl: contact.user.avatarUrl,
    },
    lastMessage: contact.lastMessage
      ? {
          text: contact.lastMessage.content,
          sentAt: contact.lastMessage.createdAt,
          authorName: contact.lastMessage.senderId === me.id ? me.name : contact.user.name,
        }
      : null,
    unreadCount: contact.unreadCount,
  };
}

function toChatMessage(
  raw: RawChatMessage,
  conversationId: string,
  me: ChatParticipant,
  other: ChatParticipant | null | undefined,
): ChatMessage {
  return {
    id: raw.id,
    conversationId,
    author: raw.senderId === me.id ? me : (other ?? me),
    text: raw.content,
    sentAt: raw.createdAt,
  };
}

async function getRealConversations(user: Pick<User, "id" | "name">): Promise<ChatConversation[]> {
  const contacts = await apiFetch<RawChatContact[]>("/chat/contacts", { auth: true });
  return contacts.map((contact) => toConversation(contact, user));
}

async function getRealMessages(
  conversation: ChatConversation,
  me: ChatParticipant,
): Promise<ChatMessage[]> {
  const otherId = otherIdOf(conversation.id);
  const raws = await apiFetch<RawChatMessage[]>(`/chat/${otherId}/messages`, { auth: true });
  return raws.map((raw) => toChatMessage(raw, conversation.id, me, conversation.otherParticipant));
}

function markRealConversationRead(conversationId: string): void {
  const otherId = otherIdOf(conversationId);
  void apiFetch(`/chat/${otherId}/read`, { method: "PATCH", auth: true }).catch(() => {
    // Best-effort: si falla, el mensaje sigue apareciendo "sin leer" y se
    // vuelve a intentar la próxima vez que se abra la conversación.
  });
}

/** Manda el mensaje por el socket y resuelve con la confirmación que llega
    por `message:new` (el back se lo emite también a quien lo mandó, ver
    ChatGateway.sendMessage). Si el back lo rechaza (permisos, sin Premium),
    Nest emite `exception` con el motivo. */
function sendRealMessage(
  conversation: ChatConversation,
  me: ChatParticipant,
  text: string,
): Promise<ChatMessage> {
  const otherId = otherIdOf(conversation.id);
  const socket = getChatSocket();
  if (!socket) return Promise.reject(new Error("Iniciá sesión de nuevo para poder chatear."));

  return new Promise<ChatMessage>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("No pudimos enviar el mensaje. Probá de nuevo."));
    }, 8000);

    function cleanup() {
      clearTimeout(timeoutId);
      socket!.off("message:new", onMessage);
      socket!.off("exception", onException);
    }

    function onMessage(raw: unknown) {
      if (!isRawChatMessage(raw)) return;
      if (raw.senderId !== me.id || raw.receiverId !== otherId || raw.content !== text) return;
      cleanup();
      resolve(toChatMessage(raw, conversation.id, me, conversation.otherParticipant));
    }

    function onException(payload: unknown) {
      cleanup();
      const record = payload as { message?: unknown } | null;
      const message = typeof record?.message === "string" ? record.message : "No se pudo enviar el mensaje.";
      reject(new Error(message));
    }

    socket.on("message:new", onMessage);
    socket.on("exception", onException);
    socket.emit("message:send", { receiverId: otherId, content: text });
  });
}

/** Id de la conversación directa con otra persona: lo usa ChatCenterProvider
    para saber a qué conversación pertenece un `message:new` del socket. */
export function directConversationId(otherUserId: string): string {
  return directId(otherUserId);
}

/** Rol del usuario logueado como participante del chat, o `null` si el chat
    no es para ese rol (hoy sólo alumno y docente; el admin no cursa ni dicta). */
export function chatRoleFor(role: User["role"]): ChatRole | null {
  return role === "student" || role === "teacher" ? role : null;
}

export function toCurrentParticipant(
  user: Pick<User, "id" | "name" | "avatarUrl">,
  role: ChatRole,
): ChatParticipant {
  return { id: user.id, name: user.name, role, avatarUrl: user.avatarUrl ?? null };
}

/**
 * Mis conversaciones. En modo real, un directo por cada docente (vista
 * alumno) o alumno (vista docente) con quien comparto un curso activo. En
 * modo mock, además la sala grupal de cada curso. Ordenadas por el mensaje
 * más reciente.
 */
export async function getMyConversations(
  user: Pick<User, "id" | "name" | "avatarUrl">,
  role: ChatRole | null,
): Promise<ChatConversation[]> {
  if (!role) return [];
  if (USE_MOCK_CHAT) return getMockConversations(role);

  try {
    return await getRealConversations(user);
  } catch (error) {
    throw new Error(backendMessageOr(error, "No pudimos cargar tus conversaciones."));
  }
}

/** Mensajes de una conversación, del más viejo al más nuevo. */
export async function getMessages(
  conversation: ChatConversation,
  me: ChatParticipant,
): Promise<ChatMessage[]> {
  if (USE_MOCK_CHAT) return getMockMessages(conversation.id);

  try {
    return await getRealMessages(conversation, me);
  } catch (error) {
    throw new Error(backendMessageOr(error, "No pudimos cargar los mensajes."));
  }
}

/** Se llama al abrir una conversación (o al recibir un mensaje con esa
    conversación abierta): la saca de "sin leer". Silenciosa por diseño, ver
    markRealConversationRead. */
export function markConversationRead(conversationId: string): void {
  if (USE_MOCK_CHAT) markMockConversationRead(conversationId);
  else markRealConversationRead(conversationId);
}

/** Manda un mensaje. En modo mock programa además la respuesta de mentira
    que le da vida a la demo (ver `scheduleCannedReply`). */
export async function sendMessage(
  conversation: ChatConversation,
  me: ChatParticipant,
  text: string,
): Promise<ChatMessage> {
  if (USE_MOCK_CHAT) return sendMockMessage(conversation.id, me, text);

  return sendRealMessage(conversation, me, text);
}

/** Mensajes nuevos en tiempo real (evento `message:new` del socket). No hace
    nada en modo mock: ahí la "vida" la da `scheduleCannedReply`, no un
    socket. Devuelve la función para desuscribirse. */
export function subscribeToMessages(callback: (message: RawChatMessage) => void): () => void {
  if (USE_MOCK_CHAT) return () => {};

  return onNewMessage((raw) => {
    if (isRawChatMessage(raw)) callback(raw);
  });
}
