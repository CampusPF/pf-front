/* Detecta una pregunta de opción múltiple dentro de la respuesta del tutor,
   para poder mostrarla con botones en vez de un bloque de texto.

   El modelo es libre: puede numerar distinto, agregar una opción de más o
   cortarse a la mitad del stream. Por eso la regla de oro acá es que ante
   CUALQUIER duda se devuelve `null` y el drawer muestra el texto tal cual —
   nunca una tarjeta a medias. Es un adorno sobre algo que ya funciona, no un
   paso obligatorio del flujo.

   El formato se lo pide el prompt del back (TUTOR_QUICK_ACTIONS.QUIZ en
   pf-back/src/aiTutor/tutor-prompt.ts): una pregunta por vez, opciones "a)" a
   "d)" y nada después de la última. */

export interface QuizOption {
  /** "a", "b", "c"… en minúscula. */
  key: string;
  text: string;
}

export interface ParsedQuiz {
  /** Lo que el tutor escribió antes de la pregunta (corrección, presentación). */
  intro: string;
  question: string;
  options: QuizOption[];
}

/** Líneas tipo "a) texto", "b. texto", "A) texto". */
const OPTION_LINE = /^\s*([a-dA-D])[).]\s+(.{1,200})$/;

const MIN_OPTIONS = 3;
const MAX_OPTIONS = 4;

export function parseQuizQuestion(markdown: string): ParsedQuiz | null {
  if (!markdown.trim()) return null;

  const lines = markdown.split("\n");

  // Índices de las líneas que parecen opciones.
  const optionIndexes: number[] = [];
  lines.forEach((line, index) => {
    if (OPTION_LINE.test(line)) optionIndexes.push(index);
  });

  if (optionIndexes.length < MIN_OPTIONS || optionIndexes.length > MAX_OPTIONS) return null;

  // Tienen que ser consecutivas: si hay texto en el medio, no es un bloque de
  // opciones sino una enumeración cualquiera.
  const first = optionIndexes[0];
  const last = optionIndexes[optionIndexes.length - 1];
  if (last - first !== optionIndexes.length - 1) return null;

  const options: QuizOption[] = [];
  for (const index of optionIndexes) {
    const match = OPTION_LINE.exec(lines[index]);
    if (!match) return null;
    options.push({ key: match[1].toLowerCase(), text: match[2].trim() });
  }

  // Las claves tienen que ser a, b, c… en orden y sin repetir.
  const expected = ["a", "b", "c", "d"].slice(0, options.length);
  if (options.some((option, index) => option.key !== expected[index])) return null;

  /* Nada relevante después de la última opción. Si el modelo siguió
     escribiendo (otra pregunta, la respuesta correcta, un cierre), se muestra
     todo como texto: convertirlo en botones escondería ese contenido. */
  const after = lines.slice(last + 1).join(" ").trim();
  if (after.length > 0) return null;

  // La pregunta es la última línea con contenido antes de las opciones.
  const before = lines.slice(0, first);
  let questionIndex = -1;
  for (let index = before.length - 1; index >= 0; index -= 1) {
    if (before[index].trim()) {
      questionIndex = index;
      break;
    }
  }
  if (questionIndex === -1) return null;

  const question = before[questionIndex].trim();
  // Una pregunta de una palabra o un título suelto no alcanza.
  if (question.length < 10) return null;

  /* Tiene que ser una pregunta de verdad. Sin esto, cualquier enumeración del
     tutor ("Para mejorar tu diseño: a) … b) … c) …") se convertía en botones
     clickeables que mandaban una respuesta a un quiz que no existe. */
  if (!question.includes("?") && !question.includes("¿")) return null;

  return {
    intro: before.slice(0, questionIndex).join("\n").trim(),
    question,
    options,
  };
}

/**
 * Lo que se manda al tutor al tocar una opción. Va el texto completo y no sólo
 * la letra para que el modelo no tenga que acordarse de qué era "la c", y para
 * que el historial de la conversación se entienda al releerlo.
 */
export function quizAnswerMessage(option: QuizOption): string {
  return `Respondo la ${option.key}) ${option.text}`;
}
