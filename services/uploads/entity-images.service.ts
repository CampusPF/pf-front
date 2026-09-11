import { apiFetch } from "@/services/api-client";
import { toFormData } from "@/services/uploads/uploads";

/* Imágenes de curso y de categoría. El back guarda `imageUrl` (lo que se
   muestra) e `imagePublicId` (para borrar la vieja en Cloudinary al
   reemplazarla). Ya no se carga una URL a mano: se sube el archivo.

   TODO(campus): todavía no existen el panel admin de categorías ni el
   formulario de curso. Cuando se armen, usar `ImageUploader` con estas
   funciones. En la CREACIÓN de un curso el orden es: primero `POST /courses`,
   y con el id que devuelve, `uploadCourseImage` — no hay id antes de crear. */

export interface UploadedImageEntity {
  id: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

/** `POST /categories/:id/image` — sólo admin. */
export function uploadCategoryImage<T extends UploadedImageEntity>(
  categoryId: string,
  file: File,
) {
  return apiFetch<T>(`/categories/${encodeURIComponent(categoryId)}/image`, {
    method: "POST",
    body: toFormData(file),
    auth: true,
  });
}

/** `POST /courses/:id/image` — teacher dueño del curso o admin. */
export function uploadCourseImage<T extends UploadedImageEntity>(
  courseId: string,
  file: File,
) {
  return apiFetch<T>(`/courses/${encodeURIComponent(courseId)}/image`, {
    method: "POST",
    body: toFormData(file),
    auth: true,
  });
}
