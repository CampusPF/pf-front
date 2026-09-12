import { ApiError } from "@/services/api-client";

/* Reglas y helpers compartidos por todos los uploads a Cloudinary (avatar,
   imagen de curso/categoría, PDFs de lección). Todos son multipart con el
   campo "file".

   La validación de acá es sólo UX (no hacer esperar un upload que el back va
   a rechazar): el back valida tipo y tamaño en serio. */

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const PDF_ACCEPT = "application/pdf";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

export type UploadKind = "image" | "pdf";

const RULES: Record<UploadKind, { types: string[]; maxBytes: number; label: string }> = {
  image: {
    types: IMAGE_ACCEPT.split(","),
    maxBytes: MAX_IMAGE_BYTES,
    label: "una imagen JPG, PNG o WebP",
  },
  pdf: { types: [PDF_ACCEPT], maxBytes: MAX_PDF_BYTES, label: "un PDF" },
};

/** Devuelve el mensaje de error, o `null` si el archivo pasa. */
export function validateFile(file: File, kind: UploadKind): string | null {
  const rule = RULES[kind];

  if (!rule.types.includes(file.type)) {
    return `El archivo tiene que ser ${rule.label}.`;
  }
  if (file.size > rule.maxBytes) {
    return `El archivo pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(rule.maxBytes)}.`;
  }
  return null;
}

/**
 * ¿El navegador puede decodificar la imagen?
 *
 * `validateFile` sólo mira tipo y tamaño; el back, además, los primeros
 * bytes. Nada de eso detecta una imagen TRUNCADA: la cabecera dice "JPEG",
 * pasa todos los filtros, y recién Cloudinary la rechaza con "Image file
 * corrupt" — un 500 y varios segundos después. Pasa seguido con fotos que se
 * descargaron a medias o se copiaron de un backup incompleto.
 *
 * `createImageBitmap` decodifica el archivo entero, así que falla con esas
 * imágenes y se puede avisar antes de subir nada. Si el navegador no lo
 * soporta, no bloquea: devuelve `true` y decide el back.
 */
export async function isDecodableImage(file: File): Promise<boolean> {
  if (typeof createImageBitmap !== "function") return true;

  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return true;
  } catch {
    return false;
  }
}

/** Arma el multipart con el campo "file" (y los extras que haga falta). */
export function toFormData(file: File, extra: Record<string, string | undefined> = {}) {
  const form = new FormData();
  form.append("file", file);

  for (const [key, value] of Object.entries(extra)) {
    if (value) form.append(key, value);
  }
  return form;
}

/* 503 = Cloudinary no está configurado en el back: no es culpa del usuario
   ni del archivo, y un "algo salió mal" genérico lo haría reintentar en vano.
   400 = archivo faltante, muy pesado o de tipo inválido: el back explica cuál
   en el body, y `ApiError.message` ya lo trae extraído. */
export function uploadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return "Servicio de archivos no disponible. Probá de nuevo más tarde.";
    }
    if (error.status === 413) return "El archivo es demasiado pesado.";
    return error.message;
  }
  return "No pudimos subir el archivo. Probá de nuevo en un momento.";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".0", "")} MB`;
}
