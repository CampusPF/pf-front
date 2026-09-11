"use client";

import { useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";

import LessonResources from "@/components/lesson-player/LessonResources";
import { BUTTON_PRIMARY, ErrorBanner, LABEL, SuccessBanner } from "@/components/admin/admin-ui";
import { inputClass } from "@/components/ui/input-styles";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import { getAdminLesson, updateLesson } from "@/services/admin/admin.service";

/* Editor de una lección: datos, video, contenido (markdown) y PDFs adjuntos.
   `GET /lessons/:id` le devuelve al admin el content/videoUrl completos. */

interface Values {
  title: string;
  order: string;
  durationMinutes: string;
  isFree: boolean;
  videoUrl: string;
  content: string;
}

export default function LessonEditor({
  lessonId,
  onSaved,
}: {
  lessonId: string;
  onSaved: () => void;
}) {
  const baseId = useId();
  const [values, setValues] = useState<Values | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminLesson(lessonId)
      .then((lesson) => {
        if (cancelled) return;
        setValues({
          title: lesson.title,
          order: String(lesson.order ?? 0),
          durationMinutes: String(lesson.durationMinutes ?? 0),
          isFree: Boolean(lesson.isFree),
          videoUrl: lesson.videoUrl ?? "",
          content: lesson.content ?? "",
        });
      })
      .catch((caught) => {
        if (!cancelled) setError(adminErrorMessage(caught, "No pudimos cargar la lección."));
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  if (!values) {
    return error ? (
      <ErrorBanner message={error} />
    ) : (
      <p className="text-text-muted flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando lección…
      </p>
    );
  }

  const set = <K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaved(false);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values || !values.title.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      await updateLesson(lessonId, {
        title: values.title.trim(),
        order: Number(values.order) || 0,
        durationMinutes: Number(values.durationMinutes) || 0,
        isFree: values.isFree,
        // Vacío = sin video. El back valida @IsUrl, así que no mandamos "".
        videoUrl: values.videoUrl.trim() || undefined,
        content: values.content,
      });
      setSaved(true);
      onSaved();
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  const id = (name: string) => `${baseId}-${name}`;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-4">
        {error && (
          <div className="sm:col-span-4">
            <ErrorBanner message={error} />
          </div>
        )}
        {saved && (
          <div className="sm:col-span-4">
            <SuccessBanner message="Lección guardada." />
          </div>
        )}

        <div className="sm:col-span-4">
          <label htmlFor={id("title")} className={LABEL}>
            Título
          </label>
          <input
            id={id("title")}
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputClass(!values.title.trim())}
          />
        </div>

        <div>
          <label htmlFor={id("order")} className={LABEL}>
            Orden
          </label>
          <input
            id={id("order")}
            type="number"
            min={0}
            value={values.order}
            onChange={(e) => set("order", e.target.value)}
            className={inputClass(false)}
          />
        </div>

        <div>
          <label htmlFor={id("duration")} className={LABEL}>
            Duración (min)
          </label>
          <input
            id={id("duration")}
            type="number"
            min={0}
            value={values.durationMinutes}
            onChange={(e) => set("durationMinutes", e.target.value)}
            className={inputClass(false)}
          />
        </div>

        <label className="text-text flex items-center gap-2 self-end pb-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={values.isFree}
            onChange={(e) => set("isFree", e.target.checked)}
            className="accent-primary size-4"
          />
          Lección de muestra (gratis)
        </label>

        <div className="sm:col-span-4">
          <label htmlFor={id("video")} className={LABEL}>
            URL del video <span className="text-text-muted font-normal">(YouTube o archivo)</span>
          </label>
          <input
            id={id("video")}
            type="url"
            value={values.videoUrl}
            onChange={(e) => set("videoUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className={inputClass(false)}
          />
        </div>

        <div className="sm:col-span-4">
          <label htmlFor={id("content")} className={LABEL}>
            Contenido <span className="text-text-muted font-normal">(markdown)</span>
          </label>
          <textarea
            id={id("content")}
            rows={10}
            value={values.content}
            onChange={(e) => set("content", e.target.value)}
            className={`${inputClass(false)} font-mono text-xs`}
          />
        </div>

        <div className="flex justify-end sm:col-span-4">
          <button type="submit" disabled={isSaving || !values.title.trim()} className={BUTTON_PRIMARY}>
            {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Guardar lección
          </button>
        </div>
      </form>

      {/* Material adjunto: sólo admin puede subir/borrar (el back lo exige). */}
      <LessonResources lessonId={lessonId} manage />
    </div>
  );
}
