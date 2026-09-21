"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, Send } from "lucide-react";

import QuizResult from "@/components/quiz/QuizResult";
import { getQuiz, submitQuizAttempt } from "@/services/quizzes/quizzes.service";
import type { Quiz, QuizAttemptResult } from "@/types/quiz.types";

/* Pantalla del checkpoint de un módulo. Cuatro estados visuales:
   intro → respondiendo → aprobado | desaprobado (los dos últimos, en QuizResult).

   Las respuestas viven en el estado del componente mientras avanza y se mandan
   todas juntas al final, en UNA sola llamada (submitQuizAttempt).

   Vive bajo learn/layout.tsx, que ya exige sesión. */

type LoadState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "error"; message: string }
  | { status: "ready"; quiz: Quiz };

type Phase =
  | { step: "intro" }
  | { step: "answering" }
  | { step: "result"; result: QuizAttemptResult };

const PRIMARY =
  "bg-primary-solid hover:bg-primary-solid-hover inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary-solid";

const SECONDARY =
  "border-border text-text-secondary hover:bg-surface-elevated hover:text-text inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

export default function QuizView({ slug, quizId }: { slug: string; quizId: string }) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [phase, setPhase] = useState<Phase>({ step: "intro" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // `disabled` recién se aplica en el próximo render: un doble click rápido
  // puede colar dos envíos. El ref los corta en el mismo instante.
  const submittingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    getQuiz(quizId, controller.signal)
      .then((quiz) => {
        if (controller.signal.aborted) return;
        setLoad(quiz ? { status: "ready", quiz } : { status: "unavailable" });
      })
      .catch((error: unknown) => {
        // Abortar el fetch rechaza la promesa: no es un error para mostrar.
        if (controller.signal.aborted) return;
        setLoad({
          status: "error",
          message: error instanceof Error ? error.message : "No pudimos cargar el checkpoint.",
        });
      });

    return () => controller.abort();
  }, [quizId]);

  const courseHref = `/courses/${slug}`;

  if (load.status !== "ready") {
    return (
      <Shell courseHref={courseHref} title="Checkpoint">
        {load.status === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-24">
            <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
            <span className="text-text-muted text-sm">Cargando checkpoint…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertCircle className="text-text-muted size-10" aria-hidden />
            <h1 className="text-text text-xl font-semibold">
              {load.status === "unavailable"
                ? "Este checkpoint todavía no está disponible"
                : "No pudimos cargar el checkpoint"}
            </h1>
            {load.status === "error" && <p className="text-text-secondary text-sm">{load.message}</p>}
            <Link href={courseHref} className="text-primary text-sm font-medium hover:underline">
              Volver al curso
            </Link>
          </div>
        )}
      </Shell>
    );
  }

  const { quiz } = load;
  const total = quiz.questions.length;
  const question = quiz.questions[index];
  const answeredCount = quiz.questions.filter((q) => answers[q.id]).length;
  const allAnswered = answeredCount === total;
  const isLast = index === total - 1;
  const unanswered = quiz.questions.map((q, i) => (answers[q.id] ? null : i + 1)).filter((n) => n !== null);

  function start() {
    setAnswers({});
    setIndex(0);
    setSubmitError(null);
    setPhase({ step: "answering" });
  }

  async function submit() {
    if (submittingRef.current || !allAnswered) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitQuizAttempt(
        quiz.id,
        quiz.questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] })),
      );
      setPhase({ step: "result", result });
    } catch (error) {
      // Las respuestas se conservan: se puede reintentar sin volver a empezar.
      setSubmitError(
        error instanceof Error ? error.message : "No pudimos enviar tus respuestas. Probá de nuevo.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <Shell courseHref={courseHref} title={quiz.title}>
      {phase.step === "intro" && (
        <div className="bg-surface border-border rounded-2xl border p-8 text-center shadow-sm sm:p-10">
          <span className="bg-primary-subtle text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
            <ClipboardCheck className="size-7" aria-hidden />
          </span>
          <h1 className="text-text mt-5 text-2xl font-bold">{quiz.title}</h1>
          <p className="text-text-secondary mt-2 text-sm">
            {total} {total === 1 ? "pregunta" : "preguntas"} · necesitás {quiz.passingScore}% para aprobar
          </p>
          <p className="text-text-muted mx-auto mt-4 max-w-sm text-sm">
            Respondés una pregunta por pantalla y enviás todo al final. Podés volver atrás y cambiar
            una respuesta antes de enviar.
          </p>
          <button type="button" onClick={start} className={`${PRIMARY} mt-8 px-6`}>
            Empezar
          </button>
        </div>
      )}

      {phase.step === "answering" && question && (
        <div className="bg-surface border-border rounded-2xl border p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-text-muted text-sm font-medium" aria-live="polite">
              Pregunta {index + 1} de {total}
            </p>
            <p className="text-text-muted text-xs tabular-nums">
              {answeredCount} de {total} respondidas
            </p>
          </div>

          <div
            className="bg-surface-elevated border-border mt-3 h-1.5 overflow-hidden rounded-full border"
            role="progressbar"
            aria-label="Avance del checkpoint"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={index + 1}
          >
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-300"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>

          {/* fieldset + legend: el lector de pantalla anuncia la pregunta al
              entrar al grupo de opciones. `key` reinicia el foco al cambiar. */}
          <fieldset key={question.id} className="mt-6 min-w-0">
            <legend className="text-text text-lg leading-snug font-semibold">{question.text}</legend>

            <div className="mt-5 flex flex-col gap-3">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 text-sm transition-colors duration-150 focus-within:ring-2 focus-within:ring-primary/40 ${
                      selected
                        ? "border-primary bg-primary-subtle text-text"
                        : "border-border text-text-secondary hover:bg-surface-elevated hover:text-text"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                      className="accent-primary mt-0.5 size-4 shrink-0"
                    />
                    <span>{option.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {submitError && (
            <p
              role="alert"
              className="bg-danger-subtle text-danger border-danger/30 mt-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{submitError}</span>
            </p>
          )}

          <div className="border-border mt-8 flex items-center justify-between gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              disabled={index === 0 || isSubmitting}
              className={SECONDARY}
            >
              <ChevronLeft className="size-5" aria-hidden />
              Anterior
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={submit}
                disabled={!allAnswered || isSubmitting}
                aria-describedby={allAnswered ? undefined : "quiz-submit-hint"}
                className={PRIMARY}
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {isSubmitting ? "Enviando…" : "Enviar"}
              </button>
            ) : (
              <button type="button" onClick={() => setIndex((i) => i + 1)} className={PRIMARY}>
                Siguiente
                <ChevronRight className="size-5" aria-hidden />
              </button>
            )}
          </div>

          {isLast && !allAnswered && (
            <p id="quiz-submit-hint" className="text-text-muted mt-3 text-right text-sm">
              {unanswered.length === 1
                ? `Te falta responder la pregunta ${unanswered[0]}.`
                : `Te faltan responder las preguntas ${unanswered.join(", ")}.`}
            </p>
          )}
        </div>
      )}

      {phase.step === "result" && (
        <QuizResult result={phase.result} courseHref={courseHref} onRetry={start} />
      )}
    </Shell>
  );
}

/* Barra mínima + columna centrada. No usa LessonHeader porque éste pide los
   datos de una lección (índice, progreso) que acá no existen. */
function Shell({
  courseHref,
  title,
  children,
}: {
  courseHref: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="bg-surface border-border sticky top-0 z-40 h-16 border-b">
        <div className="flex h-full items-center gap-3 px-4 sm:px-6">
          <Link
            href={courseHref}
            className="text-text-secondary hover:text-text hover:bg-surface-elevated flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver al curso
          </Link>
          <p className="text-text min-w-0 truncate text-sm font-medium">{title}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">{children}</main>
    </>
  );
}
