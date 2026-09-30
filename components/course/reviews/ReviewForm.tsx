"use client";

import { useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { ApiError } from "@/services/api-client";
import StarRatingInput from "@/components/ui/StarRatingInput";
import { inputClass } from "@/components/ui/input-styles";
import {
  REVIEW_COMMENT_MAX_LENGTH,
  reviewErrorMessage,
  type CourseReview,
  type ReviewInput,
} from "@/services/reviews/course-reviews.service";

/* Formulario de la reseña propia: crear o editar (el back hace upsert).

   El back modera el comentario (lista de groserías + IA) y responde 422 si es
   ofensivo. En ese caso el texto NO se borra: se marca el campo y se le da
   el foco, para que el alumno lo corrija en vez de reescribirlo entero. */
export default function ReviewForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: CourseReview | null;
  onSubmit: (input: ReviewInput) => Promise<void>;
  /** Sólo al editar: vuelve a mostrar la reseña sin guardar. */
  onCancel?: () => void;
}) {
  const baseId = useId();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentRejected, setCommentRejected] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const ratingMissing = rating === 0;
  const tooLong = comment.length > REVIEW_COMMENT_MAX_LENGTH;
  const commentInvalid = tooLong || commentRejected;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTriedSubmit(true);
    if (ratingMissing || tooLong) return;

    setIsSaving(true);
    setError(null);
    setCommentRejected(false);
    try {
      await onSubmit({ rating, comment });
    } catch (caught) {
      setError(reviewErrorMessage(caught));
      setIsSaving(false);
      if (caught instanceof ApiError && caught.status === 422) {
        setCommentRejected(true);
        // Tras re-habilitar el textarea (isSaving=false) en el próximo render.
        requestAnimationFrame(() => commentRef.current?.focus());
      }
    }
  }

  const ratingErrorId = `${baseId}-rating-error`;
  const commentId = `${baseId}-comment`;
  const counterId = `${baseId}-counter`;
  const errorId = `${baseId}-error`;

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-surface border-border space-y-4 rounded-xl border p-5">
      <div>
        <p className="text-text mb-2 text-sm font-semibold">
          {initial ? "Editá tu reseña" : "¿Qué te pareció el curso?"}
        </p>
        <StarRatingInput
          value={rating}
          onChange={setRating}
          disabled={isSaving}
          invalid={triedSubmit && ratingMissing}
        />
        {triedSubmit && ratingMissing && (
          <p id={ratingErrorId} role="alert" className="text-danger mt-1 text-xs">
            Elegí una valoración de 1 a 5 estrellas.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={commentId} className="text-text mb-1.5 block text-sm font-medium">
          Comentario <span className="text-text-muted font-normal">(opcional)</span>
        </label>
        <textarea
          ref={commentRef}
          id={commentId}
          rows={4}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            // Apenas lo edita, deja de mostrarse como rechazado.
            if (commentRejected) setCommentRejected(false);
          }}
          disabled={isSaving}
          placeholder="Contá qué te sirvió, qué mejorarías, para quién lo recomendás…"
          aria-describedby={commentRejected ? `${counterId} ${errorId}` : counterId}
          aria-invalid={commentInvalid || undefined}
          className={inputClass(commentInvalid)}
        />
        <div className="mt-1 flex items-start justify-between gap-3 text-xs">
          <p className="text-text-muted">
            Se revisa antes de publicarse. Las críticas son bienvenidas; el lenguaje ofensivo, no.
          </p>
          <p
            id={counterId}
            className={`shrink-0 tabular-nums ${tooLong ? "text-danger" : "text-text-muted"}`}
          >
            {comment.length}/{REVIEW_COMMENT_MAX_LENGTH}
          </p>
        </div>
      </div>

      {error && (
        <p id={errorId} role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="border-border text-text hover:bg-surface-elevated cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving || tooLong}
          className="bg-primary-solid hover:bg-primary-solid-hover inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {initial ? "Guardar cambios" : "Publicar reseña"}
        </button>
      </div>
    </form>
  );
}
