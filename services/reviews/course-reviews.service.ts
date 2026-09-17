import { apiFetch } from "@/services/api-client";
import type { PaginationMeta } from "@/services/api.types";
import { backendMessageOr } from "@/services/backend-message";
import { USE_MOCK_COURSES } from "@/services/courses/courses.source";

/* Reseñas de un curso: /courses/:courseId/reviews.

   El listado es público. La reseña propia va siempre por `/me` (el dueño sale
   del token), y escribirla exige inscripción activa: el back responde 403 con
   un mensaje en español que se muestra tal cual. */

export interface CourseReview {
  id: string;
  /** Entero de 1 a 5. */
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export interface CourseReviewsSummary {
  /** Un decimal. `null` = sin reseñas. */
  average: number | null;
  count: number;
  distribution: RatingDistribution;
}

export interface CourseReviewsPage {
  data: CourseReview[];
  meta: PaginationMeta;
  summary: CourseReviewsSummary;
}

/** Por qué no puede reseñar: no inscripto, o es el instructor del curso. */
export type CannotReviewReason = "not_enrolled" | "own_course";

export interface MyCourseReview {
  canReview: boolean;
  reason: CannotReviewReason | null;
  review: CourseReview | null;
}

export interface ReviewInput {
  rating: number;
  comment?: string;
}

/** Igual que el back (UpsertCourseReviewDto). */
export const REVIEW_COMMENT_MAX_LENGTH = 1000;

export const REVIEWS_PAGE_SIZE = 5;

const EMPTY_PAGE: CourseReviewsPage = {
  data: [],
  meta: { total: 0, page: 1, limit: REVIEWS_PAGE_SIZE, totalPages: 1 },
  summary: { average: null, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
};

const path = (courseId: string, suffix = "") =>
  `/courses/${encodeURIComponent(courseId)}/reviews${suffix}`;

/** `GET /courses/:id/reviews` — público, paginado, con resumen. */
export async function getCourseReviews(
  courseId: string,
  page = 1,
  signal?: AbortSignal,
): Promise<CourseReviewsPage> {
  // Los cursos mock no existen en el back: no hay reseñas que pedir.
  if (USE_MOCK_COURSES) return EMPTY_PAGE;

  return apiFetch<CourseReviewsPage>(path(courseId), {
    query: { page, limit: REVIEWS_PAGE_SIZE },
    signal,
  });
}

/** `GET /courses/:id/reviews/me` — con sesión. */
export async function getMyCourseReview(
  courseId: string,
  signal?: AbortSignal,
): Promise<MyCourseReview> {
  if (USE_MOCK_COURSES) return { canReview: false, reason: "not_enrolled", review: null };

  return apiFetch<MyCourseReview>(path(courseId, "/me"), { auth: true, signal });
}

/** `PUT /courses/:id/reviews/me` — crea o edita (una por alumno por curso). */
export function saveMyCourseReview(courseId: string, input: ReviewInput): Promise<CourseReview> {
  return apiFetch<CourseReview>(path(courseId, "/me"), {
    method: "PUT",
    auth: true,
    body: {
      rating: input.rating,
      // Vacío = sólo puntaje. No mandamos "" (el back igual lo guardaría null).
      ...(input.comment?.trim() ? { comment: input.comment.trim() } : {}),
    },
  });
}

/** `DELETE /courses/:id/reviews/me`. */
export function deleteMyCourseReview(courseId: string): Promise<null> {
  return apiFetch<null>(path(courseId, "/me"), { method: "DELETE", auth: true });
}

export function reviewErrorMessage(error: unknown, fallback = "No pudimos guardar tu reseña."): string {
  return backendMessageOr(error, fallback);
}
