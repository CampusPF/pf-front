/* Progresión secuencial de un curso: qué módulo y qué checkpoint tiene
   abierto el alumno.

   La regla la decide y la aplica el back (CourseProgressionService en
   pf-back). Esto es sólo para dibujar los candados: no pedir la progresión no
   desbloquea nada, porque el contenido y los intentos se validan igual en el
   servidor. */

export interface ModuleGate {
  moduleId: string;
  order: number;
  title: string;
  totalLessons: number;
  completedLessons: number;
  /** Todas las lecciones activas del módulo están completadas. */
  lessonsCompleted: boolean;
  /** Checkpoint vigente del módulo, si tiene. */
  quizId: string | null;
  quizPassed: boolean;
  attemptsUsed: number;
  attemptsLeft: number;
  /** Se puede entrar a las lecciones de este módulo. */
  lessonsUnlocked: boolean;
  /** Se puede rendir su checkpoint. */
  checkpointUnlocked: boolean;
  /** Por qué está cerrado, en palabras, listo para mostrar. */
  lockedReason: string | null;
}

export interface FinalCheckpointGate {
  quizId: string;
  passed: boolean;
  attemptsUsed: number;
  attemptsLeft: number;
  unlocked: boolean;
  lockedReason: string | null;
}

export interface CourseProgression {
  courseId: string;
  /** El usuario no cursa: admin o docente dueño. Ve todo abierto. */
  bypassed: boolean;
  modules: ModuleGate[];
  finalCheckpoint: FinalCheckpointGate | null;
}
