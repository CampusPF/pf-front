"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { ApiError } from "@/services/api-client";
import { inputClass } from "@/components/ui/input-styles";
import { forumErrorMessage } from "@/services/forums/forums.service";

/* Edición en línea de un hilo o de una respuesta. El back ya exponía
   PATCH /forum/threads/:id y PATCH /forum/posts/:id, pero la UI sólo dejaba
   borrar: para arreglar una palabra había que borrar y volver a escribir,
   perdiendo el lugar en la conversación (y la marca de solución).

   Mismo criterio que PostComposer con la moderación: un 422 no limpia el
   texto y devuelve el foco, así se puede reformular sin reescribir todo. */
export default function PostEditor({
  initialBody,
  maxLength,
  label = "Editar mensaje",
  onSave,
  onCancel,
}: {
  initialBody: string;
  maxLength: number;
  label?: string;
  onSave: (body: string) => Promise<void>;
  onCancel: () => void;
}) {
  const baseId = useId();
  const [body, setBody] = useState(initialBody);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Abrir el editor pone el cursor al final de lo que ya estaba escrito.
  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, []);

  const tooLong = body.length > maxLength;
  const unchanged = body.trim() === initialBody.trim();
  const canSave = body.trim().length > 0 && !tooLong && !unchanged && !isSaving;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(body.trim());
    } catch (caught) {
      setError(forumErrorMessage(caught, "No pudimos guardar los cambios."));
      if (caught instanceof ApiError && caught.status === 422) {
        setRejected(true);
        requestAnimationFrame(() => ref.current?.focus());
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3">
      <label htmlFor={`${baseId}-body`} className="sr-only">
        {label}
      </label>
      <textarea
        ref={ref}
        id={`${baseId}-body`}
        rows={4}
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          if (rejected) setRejected(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        disabled={isSaving}
        aria-invalid={tooLong || rejected || undefined}
        className={inputClass(tooLong || rejected)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-text-muted text-xs tabular-nums">
          {body.length}/{maxLength}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="border-border text-text-secondary hover:bg-surface-elevated cursor-pointer rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="bg-primary-solid hover:bg-primary-solid-hover inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Guardar
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
