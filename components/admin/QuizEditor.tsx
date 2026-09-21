"use client";

import { useId, useState } from "react";
import { CircleCheck, ClipboardCheck, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  BUTTON_GHOST_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ErrorBanner,
  LABEL,
} from "@/components/admin/admin-ui";
import { inputClass } from "@/components/ui/input-styles";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import {
  createQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  updateQuestion,
  updateQuiz,
} from "@/services/quizzes/quizzes.service";
import type { QuestionPayload, TeacherQuestion, TeacherQuiz } from "@/types/quiz.types";

/* Checkpoint de un módulo (o de fin de curso): alta, preguntas y nota mínima.

   No pide datos por su cuenta: el quiz llega por prop desde SyllabusEditor,
   que los trae todos de una para el curso entero. Cada escritura avisa por
   `onChanged` y el padre recarga — un solo dueño del estado, sin dos copias
   del mismo quiz que se puedan desincronizar.

   Las respuestas correctas SÍ se ven acá: es el dueño del curso. La vista del
   alumno usa otros tipos y otro endpoint (ver types/quiz.types). */

/** Con cuántas opciones nace una pregunta nueva, y hasta cuántas se permiten. */
const INITIAL_OPTIONS = 4;
const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;
const DEFAULT_PASSING_SCORE = 70;

export default function QuizEditor({
  courseId,
  moduleId,
  defaultTitle,
  quiz,
  onChanged,
}: {
  courseId: string;
  /** null = checkpoint de fin de curso. */
  moduleId: string | null;
  /** Título con el que nace el quiz si el docente no lo cambia. */
  defaultTitle: string;
  quiz: TeacherQuiz | null;
  onChanged: () => Promise<void> | void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    { kind: "quiz" } | { kind: "question"; id: string } | null
  >(null);

  /** Envuelve una escritura: corta el doble submit, muestra el error y recarga. */
  async function run(action: () => Promise<unknown>) {
    setIsBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
      return true;
    } catch (caught) {
      setError(adminErrorMessage(caught));
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    if (pendingDelete.kind === "question") {
      if (!quiz) return;
      await run(() => deleteQuestion(quiz.id, pendingDelete.id));
    } else if (quiz) {
      // El diálogo del quiz sólo se abre con uno cargado; comprobarlo igual
      // evita que este handler quede atado a ese invariante.
      await run(() => deleteQuiz(quiz.id));
    }

    setPendingDelete(null);
  }

  if (!quiz) {
    return (
      <div className="border-border rounded-lg border border-dashed p-4">
        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-text-muted text-sm">
            {moduleId === null
              ? "Sin checkpoint final. El alumno termina el curso sin rendir nada."
              : "Este módulo no tiene checkpoint."}
          </p>
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              run(() =>
                createQuiz({
                  courseId,
                  moduleId,
                  title: defaultTitle,
                  passingScore: DEFAULT_PASSING_SCORE,
                }),
              )
            }
            className={BUTTON_SECONDARY}
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            Agregar checkpoint
          </button>
        </div>
      </div>
    );
  }

  const questions = [...quiz.questions].sort((a, b) => a.order - b.order);

  return (
    <div className="border-border rounded-lg border">
      <QuizHeader
        quiz={quiz}
        isBusy={isBusy}
        onSave={(payload) => run(() => updateQuiz(quiz.id, payload))}
        onDelete={() => setPendingDelete({ kind: "quiz" })}
      />

      <div className="border-border flex flex-col gap-2 border-t p-3">
        {error && <ErrorBanner message={error} />}

        {questions.length === 0 && (
          <p className="text-text-muted text-sm">
            Todavía no tiene preguntas. Agregá la primera abajo.
          </p>
        )}

        {questions.map((question, index) =>
          editingId === question.id ? (
            <QuestionForm
              key={question.id}
              question={question}
              isBusy={isBusy}
              onCancel={() => setEditingId(null)}
              onSubmit={async (payload) => {
                const ok = await run(() => updateQuestion(quiz.id, question.id, payload));
                if (ok) setEditingId(null);
                return ok;
              }}
            />
          ) : (
            <QuestionRow
              key={question.id}
              question={question}
              position={index + 1}
              onEdit={() => setEditingId(question.id)}
              onDelete={() => setPendingDelete({ kind: "question", id: question.id })}
            />
          ),
        )}

        {isAdding ? (
          <QuestionForm
            isBusy={isBusy}
            nextOrder={questions.length}
            onCancel={() => setIsAdding(false)}
            onSubmit={async (payload) => {
              const ok = await run(() => createQuestion(quiz.id, payload));
              if (ok) setIsAdding(false);
              return ok;
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={`${BUTTON_SECONDARY} mt-1 self-start`}
          >
            <Plus className="size-4" aria-hidden />
            Pregunta
          </button>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        variant="danger"
        title={
          pendingDelete?.kind === "quiz" ? "¿Eliminar el checkpoint?" : "¿Eliminar la pregunta?"
        }
        description={
          pendingDelete?.kind === "quiz"
            ? `Se borra "${quiz.title}" con todas sus preguntas. Los intentos ya rendidos dejan de contar para el certificado.`
            : "Se borra la pregunta y sus opciones."
        }
        confirmLabel="Sí, eliminar"
        isPending={isBusy}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

/* ── Cabecera: título y nota mínima ───────────────────────────── */

function QuizHeader({
  quiz,
  isBusy,
  onSave,
  onDelete,
}: {
  quiz: TeacherQuiz;
  isBusy: boolean;
  onSave: (payload: { title: string; passingScore: number }) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(quiz.title);
  const [passingScore, setPassingScore] = useState(String(quiz.passingScore));

  // El back valida igual; esto es para no mandar un pedido que ya sabemos malo.
  const score = Number(passingScore);
  const isValid = title.trim().length > 0 && Number.isFinite(score) && score >= 0 && score <= 100;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    const ok = await onSave({ title: title.trim(), passingScore: score });
    if (ok) setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form onSubmit={submit} className="bg-surface-elevated/50 flex flex-wrap items-end gap-2 p-3">
        <div className="min-w-40 flex-1">
          <label htmlFor={`quiz-title-${quiz.id}`} className={LABEL}>
            Título del checkpoint
          </label>
          <input
            id={`quiz-title-${quiz.id}`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass(title.trim().length === 0)}
          />
        </div>
        <div className="w-32">
          <label htmlFor={`quiz-score-${quiz.id}`} className={LABEL}>
            Nota mínima (%)
          </label>
          <input
            id={`quiz-score-${quiz.id}`}
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            className={inputClass(!Number.isFinite(score) || score < 0 || score > 100)}
          />
        </div>
        <button type="submit" disabled={isBusy || !isValid} className={BUTTON_PRIMARY}>
          Guardar
        </button>
        <button
          type="button"
          onClick={() => {
            setTitle(quiz.title);
            setPassingScore(String(quiz.passingScore));
            setIsEditing(false);
          }}
          className={BUTTON_SECONDARY}
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div className="bg-surface-elevated/50 flex items-center gap-2 px-3 py-2.5">
      <ClipboardCheck className="text-primary size-5 shrink-0" aria-hidden />
      <span className="text-text min-w-0 flex-1 truncate font-semibold">{quiz.title}</span>
      <span className="text-text-muted shrink-0 text-xs">
        {quiz.questions.length === 1 ? "1 pregunta" : `${quiz.questions.length} preguntas`} ·
        aprueba con {quiz.passingScore}%
      </span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={BUTTON_SECONDARY}
        aria-label={`Editar checkpoint ${quiz.title}`}
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={BUTTON_GHOST_DANGER}
        aria-label={`Eliminar checkpoint ${quiz.title}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/* ── Una pregunta, en lectura ─────────────────────────────────── */

function QuestionRow({
  question,
  position,
  onEdit,
  onDelete,
}: {
  question: TeacherQuestion;
  position: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border-border rounded-lg border px-3 py-2.5">
      <div className="flex items-start gap-2">
        <span className="text-text-muted w-5 shrink-0 text-right text-xs tabular-nums">
          {position}
        </span>
        <p className="text-text min-w-0 flex-1 text-sm">{question.text}</p>
        <button
          type="button"
          onClick={onEdit}
          className={BUTTON_SECONDARY}
          aria-label={`Editar pregunta ${position}`}
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={BUTTON_GHOST_DANGER}
          aria-label={`Eliminar pregunta ${position}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      <ul className="mt-2 ml-7 flex flex-col gap-1">
        {question.options.map((option) => (
          <li key={option.id} className="flex items-start gap-2 text-sm">
            {option.isCorrect ? (
              <CircleCheck className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <span
                className="border-border mt-0.5 size-4 shrink-0 rounded-full border"
                aria-hidden
              />
            )}
            <span className={option.isCorrect ? "text-text" : "text-text-secondary"}>
              {option.text}
              {option.isCorrect && <span className="sr-only"> (respuesta correcta)</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Alta / edición de una pregunta ───────────────────────────── */

interface DraftOption {
  text: string;
  isCorrect: boolean;
}

function emptyDraft(): DraftOption[] {
  return Array.from({ length: INITIAL_OPTIONS }, () => ({ text: "", isCorrect: false }));
}

function QuestionForm({
  question,
  nextOrder,
  isBusy,
  onSubmit,
  onCancel,
}: {
  /** Presente = edición; ausente = alta. */
  question?: TeacherQuestion;
  nextOrder?: number;
  isBusy: boolean;
  onSubmit: (payload: QuestionPayload) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(question?.text ?? "");
  const [options, setOptions] = useState<DraftOption[]>(
    question
      ? question.options.map((option) => ({ text: option.text, isCorrect: option.isCorrect }))
      : emptyDraft(),
  );

  /* Puede haber dos formularios abiertos a la vez (editando una pregunta y
     agregando otra). Sin un id propio por instancia los `htmlFor` apuntarían
     al campo del otro form, y —peor— los radios compartirían `name`: serían
     UN grupo, y marcar la correcta en uno desmarcaría la del otro. */
  const formId = useId();

  // Las opciones vacías no se mandan: son los renglones de más del formulario.
  const filled = options.filter((option) => option.text.trim().length > 0);
  const correctCount = filled.filter((option) => option.isCorrect).length;
  const hasText = text.trim().length > 0;
  const isValid = hasText && filled.length >= MIN_OPTIONS && correctCount === 1;

  /* Un solo motivo por vez, el primero que falta: una lista de tres errores
     para un formulario de cuatro campos es ruido. */
  const hint = !hasText
    ? "Escribí el enunciado."
    : filled.length < MIN_OPTIONS
      ? `Cargá al menos ${MIN_OPTIONS} opciones.`
      : correctCount === 0
        ? "Marcá cuál es la respuesta correcta."
        : correctCount > 1
          ? "Sólo puede haber una respuesta correcta."
          : null;

  function setOption(index: number, patch: Partial<DraftOption>) {
    setOptions((current) =>
      current.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );
  }

  /** Marcar una correcta desmarca la anterior: es multiple choice, no multi-select. */
  function markCorrect(index: number) {
    setOptions((current) => current.map((option, i) => ({ ...option, isCorrect: i === index })));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid || isBusy) return;
    await onSubmit({
      text: text.trim(),
      order: question?.order ?? nextOrder ?? 0,
      options: filled.map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect })),
    });
  }

  return (
    <form
      onSubmit={submit}
      className="border-primary/40 bg-surface-elevated/40 flex flex-col gap-3 rounded-lg border p-3"
    >
      <div>
        <label htmlFor={`${formId}-text`} className={LABEL}>
          Enunciado
        </label>
        <input
          id={`${formId}-text`}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="¿Qué hace un decorador en NestJS?"
          className={inputClass(false)}
        />
      </div>

      <fieldset>
        <legend className={LABEL}>Opciones — marcá la correcta</legend>
        <div className="flex flex-col gap-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name={`${formId}-correct`}
                checked={option.isCorrect}
                onChange={() => markCorrect(index)}
                disabled={option.text.trim().length === 0}
                aria-label={`Marcar la opción ${index + 1} como correcta`}
                className="accent-success size-4 shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              />
              <input
                type="text"
                value={option.text}
                onChange={(e) => setOption(index, { text: e.target.value })}
                placeholder={`Opción ${index + 1}`}
                aria-label={`Texto de la opción ${index + 1}`}
                className={inputClass(false)}
              />
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
                  className={BUTTON_GHOST_DANGER}
                  aria-label={`Quitar la opción ${index + 1}`}
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={() => setOptions((current) => [...current, { text: "", isCorrect: false }])}
            className="text-primary mt-2 cursor-pointer text-xs font-medium hover:underline"
          >
            + Otra opción
          </button>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {hint && <p className="text-text-muted mr-auto text-xs">{hint}</p>}
        <button type="button" onClick={onCancel} className={BUTTON_SECONDARY}>
          Cancelar
        </button>
        <button type="submit" disabled={isBusy || !isValid} className={BUTTON_PRIMARY}>
          {isBusy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {question ? "Guardar pregunta" : "Agregar pregunta"}
        </button>
      </div>
    </form>
  );
}
