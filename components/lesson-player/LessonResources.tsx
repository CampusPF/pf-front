"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Download, FileText, Loader2, Trash2, Upload } from "lucide-react";

import { ApiError } from "@/services/api-client";
import { useAuth } from "@/components/auth/AuthProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { inputClass } from "@/components/ui/input-styles";
import {
  deleteLessonResource,
  getResourceDownloadUrl,
  listLessonResources,
  uploadLessonResource,
  type LessonResource,
} from "@/services/lessons/lesson-resources.service";
import {
  MAX_PDF_BYTES,
  PDF_ACCEPT,
  formatBytes,
  uploadErrorMessage,
  validateFile,
} from "@/services/uploads/uploads";

/* Material adjunto de la lección (PDFs privados en Cloudinary).

   - Todos ven la lista (sólo metadata) y descargan si tienen acceso al curso.
   - La URL de descarga vence en 10 min: se pide en el click y se usa en el
     acto, nunca se guarda en estado.
   - Con `manage` (editor de lección del panel admin) además se sube (PDF +
     título opcional) y se borra. Sólo para admin: el back no deja a nadie más.

   Si la lección no existe en el back (ej. modo mock) el GET da 404/400 y la
   sección directamente no se muestra. */

export default function LessonResources({
  lessonId,
  manage = false,
}: {
  lessonId: string;
  manage?: boolean;
}) {
  const { user } = useAuth();
  const isAdmin = manage && user?.role === "admin";

  const [resources, setResources] = useState<LessonResource[] | null>(null);
  const [hidden, setHidden] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<LessonResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    listLessonResources(lessonId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResources(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          setHidden(true);
          return;
        }
        setListError(err instanceof Error ? err.message : "No pudimos cargar el material.");
      });

    return () => controller.abort();
  }, [lessonId]);

  async function handleDownload(resource: LessonResource) {
    setActionError(null);
    setDownloadingId(resource.id);

    /* La pestaña se abre ANTES del await: si se abre después, el navegador lo
       toma como popup no iniciado por el usuario y lo bloquea. */
    const win = window.open("", "_blank");
    if (win) win.opener = null;

    try {
      const { url } = await getResourceDownloadUrl(lessonId, resource.id);
      if (win) win.location.href = url;
      else window.location.assign(url);
    } catch (err) {
      win?.close();
      setActionError(
        err instanceof ApiError && err.status === 403
          ? "Necesitás estar inscripto en el curso (o tener una suscripción) para descargar este material."
          : err instanceof Error
            ? err.message
            : "No pudimos generar la descarga.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setIsDeleting(true);
    setActionError(null);

    try {
      await deleteLessonResource(lessonId, toDelete.id);
      setResources((prev) => prev?.filter((r) => r.id !== toDelete.id) ?? null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No pudimos borrar el archivo.");
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  }

  const handleUploaded = useCallback((created: LessonResource) => {
    setResources((prev) => [...(prev ?? []), created]);
  }, []);

  if (hidden) return null;
  // Sin adjuntos y sin poder subir: no hay nada que mostrar.
  if (!isAdmin && resources?.length === 0) return null;

  return (
    <section aria-labelledby="resources-title" className="border-border mt-10 border-t pt-8">
      <h2 id="resources-title" className="text-text text-lg font-semibold">
        Material adjunto
      </h2>

      {listError && <ErrorLine message={listError} />}
      {actionError && <ErrorLine message={actionError} />}

      {!resources && !listError && (
        <p className="text-text-muted mt-3 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando material…
        </p>
      )}

      {resources && resources.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="bg-surface border-border flex items-center gap-3 rounded-xl border px-4 py-3"
            >
              <FileText className="text-primary size-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-text truncate text-sm font-medium">{resource.title}</p>
                <p className="text-text-muted text-xs">PDF · {formatBytes(resource.sizeBytes)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(resource)}
                disabled={downloadingId === resource.id}
                className="text-primary hover:bg-primary-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60"
              >
                {downloadingId === resource.id ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4" aria-hidden />
                )}
                Descargar
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setToDelete(resource)}
                  aria-label={`Eliminar ${resource.title}`}
                  className="text-text-muted hover:text-danger hover:bg-danger-subtle cursor-pointer rounded-lg p-2 transition-colors"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isAdmin && resources && resources.length === 0 && (
        <p className="text-text-muted mt-3 text-sm">Esta lección todavía no tiene adjuntos.</p>
      )}

      {isAdmin && resources && (
        <ResourceUploadForm lessonId={lessonId} onUploaded={handleUploaded} />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        variant="danger"
        title="¿Eliminar el archivo?"
        description={`Se va a borrar "${toDelete?.title ?? ""}" para todos los alumnos. No se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}

function ResourceUploadForm({
  lessonId,
  onUploaded,
}: {
  lessonId: string;
  onUploaded: (created: LessonResource) => void;
}) {
  // Ids únicos: en el editor admin puede haber varias lecciones abiertas a la vez.
  const uid = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    if (!picked) return setFile(null);

    const invalid = validateFile(picked, "pdf");
    setError(invalid);
    setFile(invalid ? null : picked);
    if (invalid) event.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      onUploaded(await uploadLessonResource(lessonId, file, title));
      setFile(null);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border-border mt-4 flex flex-col gap-3 rounded-xl border border-dashed p-4"
    >
      <p className="text-text text-sm font-medium">Subir PDF</p>

      <div>
        <label htmlFor={`${uid}-file`} className="text-text mb-1.5 block text-xs font-medium">
          Archivo
        </label>
        <input
          ref={fileRef}
          id={`${uid}-file`}
          type="file"
          accept={PDF_ACCEPT}
          onChange={handleFileChange}
          disabled={isUploading}
          aria-describedby={`${uid}-hint`}
          className="text-text-secondary file:border-border file:text-text file:bg-surface-elevated block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:px-3 file:py-1.5 file:text-sm"
        />
        <p id={`${uid}-hint`} className="text-text-muted mt-1 text-[11px]">
          Sólo PDF. Máximo {formatBytes(MAX_PDF_BYTES)}.
        </p>
      </div>

      <div>
        <label htmlFor={`${uid}-title`} className="text-text mb-1.5 block text-xs font-medium">
          Título <span className="text-text-muted font-normal">(opcional)</span>
        </label>
        <input
          id={`${uid}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading}
          placeholder="Si lo dejás vacío usamos el nombre del archivo"
          className={inputClass(false)}
        />
      </div>

      {error && <ErrorLine message={error} />}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!file || isUploading}
          className="bg-primary-solid hover:bg-primary-solid-hover inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          {isUploading ? "Subiendo…" : "Subir"}
        </button>
      </div>
    </form>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="bg-danger-subtle text-danger border-danger/30 mt-3 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
