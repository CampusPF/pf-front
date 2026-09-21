import { ApiError, apiFetch } from "@/services/api-client";
import type {
  CourseCheckpoint,
  CreateQuizPayload,
  QuestionPayload,
  Quiz,
  QuizAnswer,
  QuizAttemptResult,
  TeacherQuiz,
  UpdateQuizPayload,
} from "@/types/quiz.types";

/* Checkpoints (quiz de multiple choice por módulo).

   Todo pasa por el back: la corrección de un intento NUNCA se hace acá — el
   front no conoce las respuestas correctas del alumno (ver types/quiz.types).

   Las funciones de la primera mitad son del alumno; las de la segunda, del
   docente dueño del curso (el back valida titularidad y responde 403 si no). */

/* ── Alumno ───────────────────────────────────────────────────── */

/**
 * `GET /quizzes/:quizId` — el checkpoint a resolver.
 *
 * Devuelve `null` si el quiz no existe o no está cargado (404): la pantalla
 * muestra "todavía no está disponible", más útil que un cartel de error.
 *
 * El 403 SÍ se propaga: es la progresión diciendo por qué no se puede rendir
 * todavía ("te faltan 2 lecciones", "agotaste los intentos"). Tragarlo como
 * un `null` perdía justo el motivo, que es lo único accionable.
 */
export async function getQuiz(quizId: string, signal?: AbortSignal): Promise<Quiz | null> {
  try {
    return await apiFetch<Quiz>(`/quizzes/${encodeURIComponent(quizId)}`, {
      auth: true,
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * `GET /courses/:courseId/quizzes` — los checkpoints del curso y si YO los
 * aprobé.
 *
 * Es lo que usa el reproductor para marcar el temario y para bloquear
 * "Finalizar curso". Un curso sin checkpoints devuelve `[]`.
 */
export function getCourseCheckpoints(
  courseId: string,
  signal?: AbortSignal,
): Promise<CourseCheckpoint[]> {
  return apiFetch<CourseCheckpoint[]>(
    `/courses/${encodeURIComponent(courseId)}/quizzes`,
    { auth: true, signal },
  );
}

/**
 * `POST /quizzes/:quizId/attempts` — manda TODAS las respuestas juntas, en una
 * sola llamada, y devuelve el intento ya corregido por el back.
 *
 * Quien llama es responsable de deshabilitar el botón mientras espera: sin
 * eso, un doble click manda dos intentos (QuizView lo corta con un ref).
 */
export function submitQuizAttempt(
  quizId: string,
  answers: QuizAnswer[],
): Promise<QuizAttemptResult> {
  return apiFetch<QuizAttemptResult>(
    `/quizzes/${encodeURIComponent(quizId)}/attempts`,
    { method: "POST", body: { answers }, auth: true },
  );
}

/* ── Docente ──────────────────────────────────────────────────── */

/**
 * `GET /courses/:courseId/quizzes/manage` — los quizzes del curso CON las
 * respuestas correctas, para editarlos.
 *
 * Es una ruta distinta de `getCourseCheckpoints` a propósito: son dos
 * permisos y dos formas distintas. Mezclarlas en un endpoint que cambia de
 * shape según el rol es exactamente como se filtra un `isCorrect`.
 */
export function listCourseQuizzes(
  courseId: string,
  signal?: AbortSignal,
): Promise<TeacherQuiz[]> {
  return apiFetch<TeacherQuiz[]>(
    `/courses/${encodeURIComponent(courseId)}/quizzes/manage`,
    { auth: true, signal },
  );
}

/** `POST /quizzes` — crea el quiz vacío de un módulo (o el de fin de curso). */
export function createQuiz(payload: CreateQuizPayload): Promise<TeacherQuiz> {
  return apiFetch<TeacherQuiz>("/quizzes", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

/** `PATCH /quizzes/:id` — título y nota mínima. */
export function updateQuiz(
  quizId: string,
  payload: UpdateQuizPayload,
): Promise<TeacherQuiz> {
  return apiFetch<TeacherQuiz>(`/quizzes/${encodeURIComponent(quizId)}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

/** `DELETE /quizzes/:id` — se lleva puestas sus preguntas (cascada en el back). */
export function deleteQuiz(quizId: string): Promise<void> {
  return apiFetch<void>(`/quizzes/${encodeURIComponent(quizId)}`, {
    method: "DELETE",
    auth: true,
  });
}

/**
 * `POST /quizzes/:quizId/questions` — agrega una pregunta con sus opciones.
 *
 * Devuelve el quiz entero ya actualizado, así el editor no tiene que pedirlo
 * de nuevo ni parchear su estado a mano.
 *
 * El back valida que haya al menos 2 opciones y exactamente una correcta; la
 * UI valida lo mismo antes de mandar, para no gastar un round-trip en un
 * error evitable.
 */
export function createQuestion(
  quizId: string,
  payload: QuestionPayload,
): Promise<TeacherQuiz> {
  return apiFetch<TeacherQuiz>(
    `/quizzes/${encodeURIComponent(quizId)}/questions`,
    { method: "POST", body: payload, auth: true },
  );
}

/**
 * `PATCH /quizzes/:quizId/questions/:questionId` — reemplaza el enunciado y
 * TODAS las opciones.
 *
 * Reemplazar en bloque y no editar opción por opción: una pregunta de
 * multiple choice es una unidad (mover la correcta de la B a la C son dos
 * escrituras que no pueden quedar a medias).
 *
 * La ruta va anidada bajo el quiz y no suelta en `/questions/:id`: así el
 * back comprueba de paso que la pregunta sea de ESE checkpoint.
 */
export function updateQuestion(
  quizId: string,
  questionId: string,
  payload: QuestionPayload,
): Promise<TeacherQuiz> {
  return apiFetch<TeacherQuiz>(
    `/quizzes/${encodeURIComponent(quizId)}/questions/${encodeURIComponent(questionId)}`,
    { method: "PATCH", body: payload, auth: true },
  );
}

/** `DELETE /quizzes/:quizId/questions/:questionId` */
export function deleteQuestion(quizId: string, questionId: string): Promise<void> {
  return apiFetch<void>(
    `/quizzes/${encodeURIComponent(quizId)}/questions/${encodeURIComponent(questionId)}`,
    { method: "DELETE", auth: true },
  );
}
