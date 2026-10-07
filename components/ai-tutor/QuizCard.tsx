"use client";

import MarkdownRenderer from "@/components/lesson-player/MarkdownRenderer";
import type { ParsedQuiz, QuizOption } from "@/lib/tutor-quiz";

/* Una pregunta del quiz del tutor, con las opciones como botones.

   Es una capa de presentación sobre la respuesta de texto del modelo (ver
   lib/tutor-quiz.ts): si el texto no tiene exactamente la forma esperada, el
   drawer ni siquiera monta este componente y muestra el mensaje tal cual. Así
   que nada depende de que la IA respete el formato. */
export default function QuizCard({
  quiz,
  disabled,
  onAnswer,
}: {
  quiz: ParsedQuiz;
  disabled: boolean;
  onAnswer: (option: QuizOption) => void;
}) {
  return (
    <div className="space-y-3">
      {quiz.intro && (
        <div className="text-text-secondary text-sm">
          <MarkdownRenderer markdown={quiz.intro} />
        </div>
      )}

      <div className="border-border bg-surface-elevated space-y-3 rounded-xl border p-3">
        <p className="text-text text-sm font-medium">{quiz.question}</p>

        <ul className="space-y-2">
          {quiz.options.map((option) => (
            <li key={option.key}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAnswer(option)}
                className="border-border bg-surface hover:border-primary hover:bg-primary/5 flex w-full cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded text-xs font-semibold uppercase">
                  {option.key}
                </span>
                <span className="text-text-secondary">{option.text}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Se puede contestar escribiendo igual: los botones son un atajo, no
            el único camino (y si alguien quiere justificar su respuesta, el
            campo de texto sigue ahí abajo). */}
        <p className="text-text-muted text-xs">
          Tocá una opción o escribí tu respuesta abajo.
        </p>
      </div>
    </div>
  );
}
