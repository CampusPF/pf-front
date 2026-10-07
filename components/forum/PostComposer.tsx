"use client";

import { useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { ApiError } from "@/services/api-client";
import { inputClass } from "@/components/ui/input-styles";
import { POST_BODY_MAX, forumErrorMessage } from "@/services/forums/forums.service";

/* Caja para responder un hilo. Igual que ThreadForm: un 422 deja el texto
   escrito y enfoca el campo. */
export default function PostComposer({ onSubmit }: { onSubmit: (body: string) => Promise<void> }) {
  const baseId = useId();
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const tooLong = body.length > POST_BODY_MAX;
  const canSubmit = body.trim().length > 0 && !tooLong && !isSaving;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(body.trim());
      setBody("");
    } catch (caught) {
      setError(forumErrorMessage(caught, "No pudimos publicar tu respuesta."));
      if (caught instanceof ApiError && caught.status === 422) {
        setRejected(true);
        requestAnimationFrame(() => ref.current?.focus());
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-surface border-border space-y-3 rounded-xl border p-4">
      <label htmlFor={`${baseId}-reply`} className="text-text block text-sm font-medium">
        Tu respuesta
      </label>
      <textarea
        ref={ref}
        id={`${baseId}-reply`}
        rows={3}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (rejected) setRejected(false);
        }}
        disabled={isSaving}
        aria-invalid={tooLong || rejected || undefined}
        className={inputClass(tooLong || rejected)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-text-muted text-xs tabular-nums">
          {body.length}/{POST_BODY_MAX}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-primary-solid hover:bg-primary-solid-hover inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Responder
        </button>
      </div>
      {error && (
        <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
