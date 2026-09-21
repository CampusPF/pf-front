/* Modelo de los checkpoints (quiz por módulo).

   TODO(back): la forma está armada contra el documento de tareas, todavía sin
   Swagger. Cuando el endpoint exista, lo único que puede cambiar son los
   nombres de campo, y se absorbe en services/quizzes/ (mismo criterio que
   services/courses/courses.adapter.ts): los componentes no se enteran. */

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
  moduleId: string;
  moduleOrder: number;
  /** "Checkpoint del módulo 2" */
  title: string;
  /** Porcentaje mínimo para aprobar (70 = 70%). */
  passingScore: number;
  questions: QuizQuestion[];
}

/** Un checkpoint de un curso y si el alumno ya lo aprobó. */
export interface CourseCheckpoint {
  quizId: string;
  moduleId: string;
  moduleOrder: number;
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
  details: QuizAttemptDetail[];
}
