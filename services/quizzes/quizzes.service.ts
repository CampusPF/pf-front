import { MOCK_CORRECT_OPTIONS, MOCK_QUIZZES } from "@/data/quiz.mock";
import type { Course } from "@/types/course.types";
import type {
  CourseCheckpoint,
  Quiz,
  QuizAnswer,
  QuizAttemptResult,
} from "@/types/quiz.types";

/* Checkpoints (quiz por módulo).

   TODO(back): los endpoints todavía no existen. Mientras tanto la pantalla se
   arma contra mocks (data/quiz.mock.ts), y este archivo es el ÚNICO lugar que
   se toca cuando el back esté listo: cada función pasa de leer el mock a un
   `apiFetch` (ver services/certificates/certificates.service.ts como modelo).

   NEXT_PUBLIC_QUIZ_SOURCE=mock enciende los mocks. Sin la variable (lo normal
   y lo que tiene que estar en producción) no hay checkpoints: la lista sale
   vacía, "Finalizar curso" no se bloquea y la pantalla del quiz avisa que no
   está disponible. Nunca se muestran checkpoints inventados a un usuario real. */
const USE_MOCK_QUIZZES = process.env.NEXT_PUBLIC_QUIZ_SOURCE === "mock";

/* Los mocks no tienen back que recuerde qué aprobaste: se guarda en
   sessionStorage para que aprobar un checkpoint destrabe "Finalizar curso"
   aunque se recargue la pestaña. */
const PASSED_KEY = "campus.mock-quiz-passed";

function readPassed(): string[] {
  try {
    const raw = window.sessionStorage.getItem(PASSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function rememberPassed(quizId: string) {
  try {
    const passed = new Set(readPassed());
    passed.add(quizId);
    window.sessionStorage.setItem(PASSED_KEY, JSON.stringify([...passed]));
  } catch {
    /* Sin storage (modo privado): el mock simplemente no recuerda. */
  }
}

/** Latencia de mentira, para ver el estado "enviando" con el botón deshabilitado. */
function fakeLatency(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** El checkpoint a resolver, o `null` si no existe / no está disponible. */
export async function getQuiz(quizId: string): Promise<Quiz | null> {
  if (!USE_MOCK_QUIZZES) return null;

  await fakeLatency(250);
  return MOCK_QUIZZES.find((quiz) => quiz.id === quizId) ?? null;
}

/**
 * Checkpoints de un curso (uno por módulo que tenga) y si ya están aprobados.
 *
 * En modo mock el checkpoint de prueba se engancha al módulo con el mismo
 * número (el 2) de CUALQUIER curso, para poder ver el bloqueo de "Finalizar
 * curso" y el sidebar con los cursos reales del back. Un curso sin ese módulo
 * no tiene checkpoint. El back real devolverá los suyos por curso.
 */
export async function getCourseCheckpoints(
  course: Pick<Course, "modules">,
): Promise<CourseCheckpoint[]> {
  if (!USE_MOCK_QUIZZES) return [];

  const passed = readPassed();
  return MOCK_QUIZZES.flatMap((quiz) => {
    const target = course.modules.find((courseModule) => courseModule.order === quiz.moduleOrder);
    if (!target) return [];

    return [
      {
        quizId: quiz.id,
        moduleId: target.id,
        moduleOrder: quiz.moduleOrder,
        passed: passed.includes(quiz.id),
      },
    ];
  });
}

/**
 * Manda TODAS las respuestas juntas, en una sola llamada, y devuelve el
 * intento corregido. Quien llama es responsable de deshabilitar el botón
 * mientras espera: sin eso, un doble click manda dos intentos.
 */
export async function submitQuizAttempt(
  quizId: string,
  answers: QuizAnswer[],
): Promise<QuizAttemptResult> {
  if (!USE_MOCK_QUIZZES) {
    throw new Error("Los checkpoints todavía no están disponibles.");
  }

  await fakeLatency();

  const quiz = MOCK_QUIZZES.find((item) => item.id === quizId);
  if (!quiz) throw new Error("No encontramos este checkpoint.");

  const details = quiz.questions.map((question) => {
    const selected = question.options.find(
      (option) => option.id === answers.find((a) => a.questionId === question.id)?.optionId,
    );
    const correctOption = question.options.find(
      (option) => option.id === MOCK_CORRECT_OPTIONS[question.id],
    );

    return {
      questionId: question.id,
      questionText: question.text,
      correct: selected?.id === correctOption?.id,
      selectedOptionText: selected?.text ?? "Sin responder",
      correctOptionText: correctOption?.text,
    };
  });

  const correctCount = details.filter((detail) => detail.correct).length;
  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;
  if (passed) rememberPassed(quizId);

  return {
    score,
    passed,
    passingScore: quiz.passingScore,
    correctCount,
    totalQuestions: quiz.questions.length,
    details,
  };
}
