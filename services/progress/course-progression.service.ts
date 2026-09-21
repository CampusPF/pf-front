import { apiFetch } from "@/services/api-client";
import type {
  CourseProgression,
  FinalCheckpointGate,
  ModuleGate,
} from "@/types/progression.types";

/* Progresión secuencial del curso (módulos y checkpoints desbloqueados).

   Es información para la UI, no el control de acceso: el back vuelve a
   validar en GET /lessons/:id y al rendir un checkpoint. Si esta llamada
   falla, la pantalla degrada a "todo abierto" y quien corta es el servidor. */

/** `GET /courses/:courseId/progression` */
export function getCourseProgression(
  courseId: string,
  signal?: AbortSignal,
): Promise<CourseProgression> {
  return apiFetch<CourseProgression>(
    `/courses/${encodeURIComponent(courseId)}/progression`,
    { auth: true, signal },
  );
}

/** El gate de un módulo. `null` si todavía no cargó la progresión. */
export function moduleGate(
  progression: CourseProgression | null,
  moduleId: string,
): ModuleGate | null {
  return progression?.modules.find((gate) => gate.moduleId === moduleId) ?? null;
}

/**
 * ¿Se puede entrar a las lecciones de este módulo?
 *
 * Sin progresión cargada devuelve `true` a propósito: un fallo de red no
 * puede dejar al alumno mirando un curso entero bloqueado. El back es el que
 * de verdad no sirve el contenido.
 */
export function isModuleUnlocked(
  progression: CourseProgression | null,
  moduleId: string,
): boolean {
  return moduleGate(progression, moduleId)?.lessonsUnlocked ?? true;
}

/** El gate del checkpoint de un módulo, o el de fin de curso si `moduleId` es null. */
export function checkpointGate(
  progression: CourseProgression | null,
  quizId: string,
): { unlocked: boolean; attemptsLeft: number; passed: boolean; lockedReason: string | null } | null {
  if (!progression) return null;

  const fromModule = progression.modules.find((gate) => gate.quizId === quizId);
  if (fromModule) {
    return {
      unlocked: fromModule.checkpointUnlocked,
      attemptsLeft: fromModule.attemptsLeft,
      passed: fromModule.quizPassed,
      lockedReason: checkpointLockedReason(fromModule),
    };
  }

  const final: FinalCheckpointGate | null = progression.finalCheckpoint;
  if (final?.quizId === quizId) {
    return {
      unlocked: final.unlocked,
      attemptsLeft: final.attemptsLeft,
      passed: final.passed,
      lockedReason: final.lockedReason,
    };
  }

  return null;
}

/**
 * Por qué no se puede rendir el checkpoint de un módulo. El back manda el
 * motivo del módulo cerrado; el de "te faltan lecciones" se arma acá porque
 * depende de cuántas van, que ya viene en el gate.
 */
function checkpointLockedReason(gate: ModuleGate): string | null {
  if (gate.checkpointUnlocked) return null;
  if (!gate.lessonsUnlocked) return gate.lockedReason;

  const pending = gate.totalLessons - gate.completedLessons;
  if (pending <= 0) return gate.lockedReason;

  return pending === 1
    ? "Te falta 1 lección de este módulo para rendir el checkpoint"
    : `Te faltan ${pending} lecciones de este módulo para rendir el checkpoint`;
}
