import Link from "next/link";
import { CheckCircle2, RotateCcw, Target, X } from "lucide-react";

import type { QuizAttemptResult } from "@/types/quiz.types";

/* Resultado de un intento. Los dos estados comparten el detalle de lo que se
   erró; cambia el tono. El desaprobado es a propósito neutro (sin rojo ni
   íconos de error): un checkpoint es para repasar, no un examen. */

export default function QuizResult({
  result,
  courseHref,
  onRetry,
}: {
  result: QuizAttemptResult;
  courseHref: string;
  onRetry: () => void;
}) {
  const wrong = result.details.filter((detail) => !detail.correct);

  return (
    <div
      className={`bg-surface rounded-2xl border p-6 shadow-sm sm:p-8 ${
        result.passed ? "border-success/40" : "border-border"
      }`}
    >
      <div className="text-center">
        <span
          className={`mx-auto flex size-14 items-center justify-center rounded-full ${
            result.passed ? "bg-success-subtle text-success" : "bg-surface-elevated text-text-muted"
          }`}
        >
          {result.passed ? (
            <CheckCircle2 className="size-7" aria-hidden />
          ) : (
            <Target className="size-7" aria-hidden />
          )}
        </span>

        <h1 className="text-text mt-4 text-3xl font-bold tabular-nums">
          {result.passed
            ? `${result.score}% · ¡Aprobado!`
            : `${result.score}% · Necesitás ${result.passingScore}%`}
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          {result.passed
            ? `Acertaste ${result.correctCount} de ${result.totalQuestions}.`
            : `Acertaste ${result.correctCount} de ${result.totalQuestions}. Repasá lo que falló y probá de nuevo cuando quieras.`}
        </p>
      </div>

      <div className="border-border mt-8 border-t pt-6">
        <h2 className="text-text text-sm font-semibold">
          {wrong.length === 0
            ? "No tuviste ningún error"
            : wrong.length === 1
              ? "Lo que fallaste (1 pregunta)"
              : `Lo que fallaste (${wrong.length} preguntas)`}
        </h2>

        {wrong.length > 0 && (
          <ul className="mt-4 flex flex-col gap-4">
            {wrong.map((detail) => (
              <li key={detail.questionId} className="bg-surface-elevated border-border rounded-xl border p-4">
                <p className="text-text text-sm font-medium">{detail.questionText}</p>
                <p className="text-text-secondary mt-3 flex items-start gap-2 text-sm">
                  <X className="text-danger mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    <span className="text-text-muted">Tu respuesta: </span>
                    {detail.selectedOptionText}
                  </span>
                </p>
                {detail.correctOptionText && (
                  <p className="text-text-secondary mt-2 flex items-start gap-2 text-sm">
                    <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      <span className="text-text-muted">Correcta: </span>
                      {detail.correctOptionText}
                    </span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={courseHref}
          className="border-border text-text-secondary hover:bg-surface-elevated hover:text-text inline-flex cursor-pointer items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150"
        >
          Volver al curso
        </Link>
        {!result.passed && (
          <button
            type="button"
            onClick={onRetry}
            className="bg-primary-solid hover:bg-primary-solid-hover inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150"
          >
            <RotateCcw className="size-4" aria-hidden />
            Volver a intentar
          </button>
        )}
      </div>
    </div>
  );
}
