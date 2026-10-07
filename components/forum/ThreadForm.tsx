"use client";

import { useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { ApiError } from "@/services/api-client";
import { inputClass } from "@/components/ui/input-styles";
import {
  THREAD_BODY_MAX,
  THREAD_TITLE_MAX,
  forumErrorMessage,
  type ThreadInput,
} from "@/services/forums/forums.service";

/* Formulario para abrir un hilo. Un 422 (moderación) enfoca el texto para que
   quien escribe lo reescriba sin perderlo. */
export default function ThreadForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: ThreadInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const baseId = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const titleTooShort = title.trim().length > 0 && title.trim().length < 3;
  const titleTooLong = title.length > THREAD_TITLE_MAX;
  const bodyTooLong = body.length > THREAD_BODY_MAX;
  const canSubmit = title.trim().length >= 3 && !titleTooLong && body.trim().length > 0 && !bodyTooLong && !isSaving;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
    } catch (caught) {
      setError(forumErrorMessage(caught, "No pudimos publicar el hilo."));
      setIsSaving(false);
      if (caught instanceof ApiError && caught.status === 422) {
        setRejected(true);
        requestAnimationFrame(() => bodyRef.current?.focus());
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-surface border-border space-y-4 rounded-xl border p-5">
      <div>
        <label htmlFor={`${baseId}-title`} className="text-text mb-1.5 block text-sm font-medium">
          Título
        </label>
        <input
          id={`${baseId}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSaving}
          aria-invalid={titleTooShort || titleTooLong || undefined}
          className={inputClass(titleTooShort || titleTooLong)}
          placeholder="Resumí tu duda o tema"
        />
        <p className="text-text-muted mt-1 text-xs tabular-nums">
          {title.length}/{THREAD_TITLE_MAX}
        </p>
      </div>

      <div>
        <label htmlFor={`${baseId}-body`} className="text-text mb-1.5 block text-sm font-medium">
          Mensaje
        </label>
        <textarea
          ref={bodyRef}
          id={`${baseId}-body`}
          rows={5}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (rejected) setRejected(false);
          }}
          disabled={isSaving}
          aria-invalid={bodyTooLong || rejected || undefined}
          className={inputClass(bodyTooLong || rejected)}
        />
        <p className="text-text-muted mt-1 text-xs tabular-nums">
          {body.length}/{THREAD_BODY_MAX}
        </p>
      </div>

      {error && (
        <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border-border text-text hover:bg-surface-elevated cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-primary-solid hover:bg-primary-solid-hover inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Publicar hilo
        </button>
      </div>
    </form>
  );
}
