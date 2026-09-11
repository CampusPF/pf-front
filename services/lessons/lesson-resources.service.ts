import { apiFetch } from "@/services/api-client";
import { toFormData } from "@/services/uploads/uploads";

/* PDFs adjuntos de una lección. Se suben a Cloudinary como `authenticated`:
   el listado trae sólo metadata, nunca una URL. Para descargar hay que pedir
   una URL firmada que vence a los 10 minutos. */

export interface LessonResource {
  id: string;
  title: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ResourceDownload {
  url: string;
  expiresAt: string;
  title: string;
}

const base = (lessonId: string) =>
  `/lessons/${encodeURIComponent(lessonId)}/resources`;

/** `GET /lessons/:id/resources`. */
export function listLessonResources(lessonId: string, signal?: AbortSignal) {
  return apiFetch<LessonResource[]>(base(lessonId), { auth: true, signal });
}

/** `POST /lessons/:id/resources` — sólo admin. */
export function uploadLessonResource(lessonId: string, file: File, title?: string) {
  return apiFetch<LessonResource>(base(lessonId), {
    method: "POST",
    body: toFormData(file, { title: title?.trim() }),
    auth: true,
  });
}

/**
 * `GET /lessons/:id/resources/:resourceId/download` — 403 si no hay acceso.
 *
 * La URL vence en 10 minutos: NO guardarla en estado ni cachearla. Pedirla en
 * el click de "Descargar" y usarla en el acto.
 */
export function getResourceDownloadUrl(lessonId: string, resourceId: string) {
  return apiFetch<ResourceDownload>(
    `${base(lessonId)}/${encodeURIComponent(resourceId)}/download`,
    { auth: true },
  );
}

/** `DELETE /lessons/:id/resources/:resourceId` — sólo admin. Borra también en Cloudinary. */
export function deleteLessonResource(lessonId: string, resourceId: string) {
  return apiFetch<null>(`${base(lessonId)}/${encodeURIComponent(resourceId)}`, {
    method: "DELETE",
    auth: true,
  });
}
