"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, ImageUp, Loader2 } from "lucide-react";

import {
  IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
  formatBytes,
  isDecodableImage,
  uploadErrorMessage,
  validateFile,
} from "@/services/uploads/uploads";

/* Uploader de imagen genérico (avatar, curso, categoría). Reemplaza a los
   viejos campos de "URL de imagen": se elige el archivo y se sube en el acto
   con la función que se le pasa, que es la que conoce el endpoint.

   Mientras sube muestra la preview local (object URL) para que el cambio se
   vea al instante; cuando responde, manda lo que devolvió el back. */

export interface ImageUploaderProps<T> {
  /** URL actual (la que ya está guardada), o null si no hay. */
  currentUrl?: string | null;
  /** Llama al endpoint. Recibe el archivo ya validado. */
  upload: (file: File) => Promise<T>;
  onUploaded: (result: T) => void;
  label: string;
  /** "circle" para avatar, "rect" para portadas. */
  shape?: "circle" | "rect";
  /** Lo que se ve si no hay imagen (ej. la inicial del nombre). */
  fallback?: React.ReactNode;
  disabled?: boolean;
}

export default function ImageUploader<T>({
  currentUrl,
  upload,
  onUploaded,
  label,
  shape = "rect",
  fallback,
  disabled = false,
}: ImageUploaderProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hintId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Liberar el object URL al reemplazarlo o al desmontar.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Resetear el input: si no, elegir el mismo archivo otra vez no dispara change.
    event.target.value = "";
    if (!file) return;

    const invalid = validateFile(file, "image");
    if (invalid) {
      setError(invalid);
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);

    try {
      // Antes de gastar la subida: una imagen truncada pasa los filtros de
      // tipo y tamaño, pero Cloudinary la rechaza y el usuario sólo ve un
      // "no se pudo subir" genérico varios segundos después.
      if (!(await isDecodableImage(file))) {
        setError(
          "No pudimos abrir esta imagen: puede estar dañada o incompleta. Probá con otra.",
        );
        return;
      }

      onUploaded(await upload(file));
    } catch (caught) {
      setError(uploadErrorMessage(caught));
    } finally {
      setPreview(null);
      setIsUploading(false);
    }
  }

  const shown = preview ?? currentUrl ?? null;
  const frame =
    shape === "circle" ? "size-20 rounded-full" : "aspect-video w-40 rounded-xl";

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className={`bg-surface-elevated border-border relative flex shrink-0 items-center justify-center overflow-hidden border ${frame}`}
        >
          {shown ? (
            // <img> y no next/image: las URLs de Cloudinary (y las externas de
            // los seeds) son dinámicas y no queremos atar remotePatterns acá.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            fallback ?? <ImageUp className="text-text-muted size-6" aria-hidden />
          )}
          {isUploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" aria-hidden />
            </span>
          )}
        </div>

        <div>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={handleChange}
            disabled={disabled || isUploading}
            aria-describedby={hintId}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
            className="border-border text-text hover:bg-surface-elevated cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Subiendo…" : label}
          </button>
          <p id={hintId} className="text-text-muted mt-1.5 text-[11px]">
            JPG, PNG o WebP. Máximo {formatBytes(MAX_IMAGE_BYTES)}.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-danger mt-2 flex items-start gap-1.5 text-xs">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
