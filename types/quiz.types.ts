/* Modelo de los checkpoints (quiz de multiple choice por módulo).

   Las formas de acá son EL contrato con pf-back (src/quizzes). Hay dos vistas
   distintas del mismo dato:

   - la del alumno (`Quiz`, `QuizAttemptResult`): nunca trae cuál opción es la
     correcta — la corrección la hace el back;
   - la del docente (`TeacherQuiz`): sí la trae, porque necesita verla para
     editarla.

   Que sean tipos separados no es ceremonia: es lo que hace que un componente
   del alumno no pueda leer `isCorrect` ni por accidente. */

/* ── Vista del alumno ─────────────────────────────────────────── */

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

/** Lo que se le muestra al alumno: NUNCA trae cuál opción es la correcta. */
export interface Quiz {
  id: string;
  courseId: string;
  /** null = checkpoint de fin de curso, no de un módulo puntual. */
  moduleId: string | null;
  title: string;
  /** Porcentaje mínimo para aprobar (70 = 70%). */
  passingScore: number;
  /** Cuántas veces se puede rendir en total. */
  maxAttempts: number;
  /** Intentos que le quedan al alumno. 0 = agotado (el back devuelve 403). */
  attemptsLeft: number;
  /** Ya lo aprobó: puede verlo, pero no volver a rendirlo. */
  passed: boolean;
  /** Puede rendirlo AHORA. false si ya aprobó o si agotó los intentos. */
  canAttempt: boolean;
  questions: QuizQuestion[];
}

/** Un checkpoint de un curso y si el alumno ya lo aprobó. */
export interface CourseCheckpoint {
  quizId: string;
  /** null = checkpoint de fin de curso. */
  moduleId: string | null;
  /** Título del quiz: es lo que se muestra en el temario y en el bloqueo. */
  title: string;
  passed: boolean;
}

/** Una respuesta del alumno. Se mandan todas juntas, en una sola llamada. */
export interface QuizAnswer {
  questionId: string;
  optionId: string;
}

/** Resultado de una pregunta dentro de un intento ya corregido. */
export interface QuizAttemptDetail {
  questionId: string;
  questionText: string;
  correct: boolean;
  selectedOptionText: string;
  /** El back decide si revela la correcta; si no la manda, la UI no la muestra. */
  correctOptionText?: string;
}

export interface QuizAttemptResult {
  /** 0–100. */
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  /**
   * Intentos que quedan DESPUÉS de éste, ya descontados por el back.
   *
   * Lo manda el servidor en vez de que el front reste uno: la pantalla se
   * carga una sola vez y su número local quedaba viejo en el segundo intento,
   * ofreciendo "volver a intentar" con los intentos ya agotados.
   */
  attemptsLeft: number;
  details: QuizAttemptDetail[];
}

/* ── Vista del docente ────────────────────────────────────────── */

/** Igual que `QuizOption`, pero con la respuesta: sólo para el dueño del curso. */
export interface TeacherOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TeacherQuestion {
  id: string;
  text: string;
  order: number;
  options: TeacherOption[];
}

export interface TeacherQuiz {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  passingScore: number;
  questions: TeacherQuestion[];
}

/** Alta de un quiz: nace vacío y después se le agregan preguntas. */
export interface CreateQuizPayload {
  courseId: string;
  /** null u omitido = checkpoint de fin de curso. */
  moduleId?: string | null;
  title: string;
  passingScore?: number;
}

export type UpdateQuizPayload = Partial<Pick<TeacherQuiz, "title" | "passingScore">>;

/** Una opción al crear o editar una pregunta. Sin `id`: se reemplazan todas. */
export interface QuestionOptionPayload {
  text: string;
  isCorrect: boolean;
}

export interface QuestionPayload {
  text: string;
  order?: number;
  options: QuestionOptionPayload[];
}
