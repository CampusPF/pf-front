import type { ChatParticipant } from "@/types/chat.types";

/* Datos de mentira para el chat en vivo. Sólo se usan con
   NEXT_PUBLIC_CHAT_SOURCE=mock (ver services/chat/chat.service.ts).

   Dos cursos de demo, reutilizando el instructor de data/courses.mock.ts
   ("JavaScript Moderno" → Fernando García, "Fundamentos de React" → Sofía
   Albornoz) para que el nombre coincida si se mira el curso al lado.

   Ninguna de las dos personas de acá es "vos": quien esté logueado (alumno o
   docente) ocupa su propio lugar en la conversación con su nombre real — el
   service arma los mensajes históricos sólo con la OTRA parte (el docente si
   sos alumno, el alumno si sos docente) para no inventar mensajes previos
   bajo un nombre que no es el tuyo. */

export interface MockStudent {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface MockCourseChat {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  instructor: { id: string; name: string; avatarUrl: string | null };
  students: MockStudent[];
}

export const MOCK_COURSE_CHATS: MockCourseChat[] = [
  {
    courseId: "1",
    courseSlug: "javascript-moderno",
    courseTitle: "JavaScript Moderno",
    instructor: { id: "mock-instructor-1", name: "Fernando García", avatarUrl: null },
    students: [
      { id: "mock-student-1a", name: "Lucía Fernández", avatarUrl: null },
      { id: "mock-student-1b", name: "Martín Sosa", avatarUrl: null },
    ],
  },
  {
    courseId: "2",
    courseSlug: "fundamentos-de-react",
    courseTitle: "Fundamentos de React",
    instructor: { id: "mock-instructor-2", name: "Sofía Albornoz", avatarUrl: null },
    students: [{ id: "mock-student-2a", name: "Camila Rojas", avatarUrl: null }],
  },
];

export interface SeedMessage {
  authorId: string;
  text: string;
  /** Minutos antes de "ahora": se recalcula al cargar el módulo, nunca queda vieja. */
  minutesAgo: number;
}

/** Historial de la sala grupal, por courseId. */
export const MOCK_GROUP_HISTORY: Record<string, SeedMessage[]> = {
  "1": [
    {
      authorId: "mock-instructor-1",
      text: "¡Bienvenidos! Cualquier duda del módulo la dejamos por acá, la respondo para todos.",
      minutesAgo: 180,
    },
    {
      authorId: "mock-student-1a",
      text: "¿El TP de async/await se entrega por el campus o por mail?",
      minutesAgo: 95,
    },
    {
      authorId: "mock-instructor-1",
      text: "Por el campus, adjuntándolo en la lección del módulo 4.",
      minutesAgo: 92,
    },
    { authorId: "mock-student-1b", text: "Buenísimo, gracias!", minutesAgo: 90 },
  ],
  "2": [
    {
      authorId: "mock-instructor-2",
      text: "Hola a todos, esta semana vemos hooks personalizados. Traigan dudas del TP anterior si quedó algo picando.",
      minutesAgo: 150,
    },
    {
      authorId: "mock-student-2a",
      text: "Yo tengo una sobre useEffect con cleanup, ¿la vemos acá o en la clase?",
      minutesAgo: 60,
    },
    {
      authorId: "mock-instructor-2",
      text: "Dale, contame el caso y la vemos ahora.",
      minutesAgo: 58,
    },
  ],
};

/**
 * Apertura del chat directo con cada alumno, SÓLO del lado del alumno (nunca
 * simula un mensaje "mío" previo). El docente ve lo mismo en su chat con ese
 * alumno.
 */
export const MOCK_DIRECT_HISTORY: Record<string, SeedMessage[]> = {
  "mock-student-1a": [
    {
      authorId: "mock-student-1a",
      text: "Hola profe! Quería preguntarte algo puntual de la lección de promesas, ¿tenés un minuto?",
      minutesAgo: 35,
    },
  ],
  "mock-student-1b": [
    {
      authorId: "mock-student-1b",
      text: "Buenas! Se me traba el proyecto final en la parte de fetch, ¿lo podemos ver por acá?",
      minutesAgo: 20,
    },
  ],
  "mock-student-2a": [
    {
      authorId: "mock-student-2a",
      text: "Hola! Te escribo por lo del cleanup de useEffect que comenté en la sala.",
      minutesAgo: 55,
    },
  ],
};

/**
 * Apertura del directo alumno↔docente del lado del DOCENTE hacia el alumno
 * real logueado (no confundir con `MOCK_DIRECT_HISTORY`: esos son los
 * directos del docente con Lucía/Martín/Camila, alumnos de mentira que sólo
 * existen en la vista del docente). Sin esto, un alumno real veía su propio
 * chat con el docente vacío.
 */
export const MOCK_INSTRUCTOR_GREETING: Record<string, SeedMessage> = {
  "1": {
    authorId: "mock-instructor-1",
    text: "¡Hola! Cualquier consulta puntual del curso, escribime por acá.",
    minutesAgo: 25,
  },
  "2": {
    authorId: "mock-instructor-2",
    text: "¡Hola! Si te trabás con algo del curso, escribime por acá y lo vemos.",
    minutesAgo: 15,
  },
};

/** Conversaciones que arrancan con mensajes sin leer, para ver la insignia. */
export const MOCK_UNREAD_SEED: Record<string, number> = {
  "group-1": 2,
  "direct-mock-student-1b": 1,
};

/** Respuesta de mentira que llega sola unos segundos después de escribir en
    un chat directo — la parte "en vivo" de la demo. */
const CANNED_TEACHER_REPLIES = [
  "Dale, dejame revisarlo y te contesto en un toque.",
  "Buena pregunta. Fijate en el apunte de la lección, y si no te queda te lo explico con un ejemplo.",
  "Sí, eso es normal, no te preocupes — seguimos por acá.",
];

const CANNED_STUDENT_REPLIES = [
  "Genial, gracias profe!",
  "Ah dale, ahora lo pruebo.",
  "Perfecto, eso era. Gracias por la ayuda!",
];

export function pickCannedReply(authorRole: "teacher" | "student"): string {
  const pool = authorRole === "teacher" ? CANNED_TEACHER_REPLIES : CANNED_STUDENT_REPLIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function toParticipant(
  person: { id: string; name: string; avatarUrl: string | null },
  role: ChatParticipant["role"],
): ChatParticipant {
  return { id: person.id, name: person.name, role, avatarUrl: person.avatarUrl };
}
