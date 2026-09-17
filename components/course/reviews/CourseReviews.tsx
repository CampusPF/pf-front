"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, MessageSquareText, Pencil, Trash2 } from "lucide-react";

import ReviewForm from "@/components/course/reviews/ReviewForm";
import ReviewItem from "@/components/course/reviews/ReviewItem";
import ReviewsSummary from "@/components/course/reviews/ReviewsSummary";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCourseLearning } from "@/components/course/CourseLearningProvider";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import {
  deleteMyCourseReview,
  getCourseReviews,
  getMyCourseReview,
  reviewErrorMessage,
  saveMyCourseReview,
  type CourseReview,
  type CourseReviewsPage,
  type MyCourseReview,
  type ReviewInput,
} from "@/services/reviews/course-reviews.service";

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; page: CourseReviewsPage; reviews: CourseReview[] };

/* Pestaña "Reseñas" del detalle del curso.

   - El listado y el resumen son públicos: se ven sin login.
   - El formulario aparece sólo si el back dice `canReview` (inscripción
     activa y no ser el instructor). Si no, se explica por qué.
   - Al guardar o borrar: se recarga el listado (cambia el promedio), se
     refresca la página del server (el promedio del hero) y se invalida el
     catálogo para que la landing no muestre el valor viejo por 5 minutos. */
export default function CourseReviews() {
  const router = useRouter();
  const { user } = useAuth();
  const { course, progress, isAuthenticated, isLoading: sessionLoading } = useCourseLearning();

  const [list, setList] = useState<ListState>({ status: "loading" });
  const [listVersion, setListVersion] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [mine, setMine] = useState<MyCourseReview | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Listado público (página 1). `listVersion` lo vuelve a pedir tras escribir.
  useEffect(() => {
    const controller = new AbortController();
    getCourseReviews(course.id, 1, controller.signal)
      .then((page) => {
        if (!controller.signal.aborted) setList({ status: "ready", page, reviews: page.data });
      })
      .catch(() => {
        if (!controller.signal.aborted) setList({ status: "error" });
      });
    return () => controller.abort();
  }, [course.id, listVersion]);

  // La reseña propia. Depende de la inscripción: al inscribirse desde el hero
  // (EnrollCTA refresca el progreso) el formulario aparece sin recargar.
  const enrollmentId = progress?.enrollmentId ?? null;
  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getMyCourseReview(course.id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setMine(result);
      })
      .catch(() => {
        // Sin esto no se puede ofrecer el formulario, pero el listado público
        // sigue sirviendo: no es un error que valga la pena mostrar.
        if (!controller.signal.aborted) setMine(null);
      });
    return () => controller.abort();
  }, [course.id, isAuthenticated, enrollmentId]);

  function afterWrite() {
    setListVersion((v) => v + 1);
    router.refresh();
    void revalidateCatalog().catch(() => undefined);
  }

  async function handleSave(input: ReviewInput) {
    const review = await saveMyCourseReview(course.id, input);
    setMine((prev) => ({ canReview: true, reason: null, ...prev, review }));
    setIsEditing(false);
    afterWrite();
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyCourseReview(course.id);
      setMine((prev) => (prev ? { ...prev, review: null } : prev));
      setConfirmDelete(false);
      afterWrite();
    } catch (caught) {
      setDeleteError(reviewErrorMessage(caught, "No pudimos borrar tu reseña."));
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function loadMore() {
    if (list.status !== "ready") return;
    setIsLoadingMore(true);
    try {
      const next = await getCourseReviews(course.id, list.page.meta.page + 1);
      setList({ status: "ready", page: next, reviews: [...list.reviews, ...next.data] });
    } catch {
      // El botón queda disponible para reintentar.
    } finally {
      setIsLoadingMore(false);
    }
  }

  const myReview = mine?.review ?? null;
  // La propia se muestra arriba, aparte: no la repetimos en el listado.
  const others =
    list.status === "ready" ? list.reviews.filter((review) => review.author.id !== user?.id) : [];
  const hasMore = list.status === "ready" && list.page.meta.page < list.page.meta.totalPages;

  return (
    <div className="space-y-6">
      {list.status === "ready" && <ReviewsSummary summary={list.page.summary} />}

      {/* ── Mi reseña ───────────────────────────────────────────── */}
      <MyReviewSlot
        courseSlug={course.slug}
        sessionLoading={sessionLoading}
        isAuthenticated={isAuthenticated}
        mine={mine}
      >
        {myReview && !isEditing ? (
          <ReviewItem
            review={myReview}
            isMine
            actions={
              <>
                {/* Editar pide inscripción activa (el back la exige en el
                    PUT); borrar no, así que ese botón queda siempre. */}
                {mine?.canReview && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    aria-label="Editar tu reseña"
                    className="text-text-muted hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Borrar tu reseña"
                  className="text-text-muted hover:text-danger hover:bg-danger-subtle cursor-pointer rounded-lg p-2 transition-colors"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </>
            }
          />
        ) : mine?.canReview ? (
          <ReviewForm
            // La key reinicia el formulario con los valores guardados al
            // volver a editar.
            key={myReview?.updatedAt ?? "new"}
            initial={myReview}
            onSubmit={handleSave}
            onCancel={myReview ? () => setIsEditing(false) : undefined}
          />
        ) : null}
      </MyReviewSlot>

      {deleteError && (
        <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
          {deleteError}
        </p>
      )}

      {/* ── Listado ─────────────────────────────────────────────── */}
      {list.status === "loading" && (
        <div className="space-y-3" aria-busy="true">
          <span className="sr-only">Cargando reseñas</span>
          {[0, 1].map((i) => (
            <div key={i} className="bg-surface-elevated h-24 animate-pulse rounded-xl" aria-hidden />
          ))}
        </div>
      )}

      {list.status === "error" && (
        <p role="alert" className="text-text-muted flex items-center gap-2 text-sm">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          No pudimos cargar las reseñas.
          <button
            type="button"
            onClick={() => setListVersion((v) => v + 1)}
            className="text-primary cursor-pointer font-medium hover:underline"
          >
            Reintentar
          </button>
        </p>
      )}

      {list.status === "ready" && others.length === 0 && !myReview && (
        <div className="border-border flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
          <MessageSquareText className="text-text-muted size-8" aria-hidden />
          <p className="text-text font-medium">Todavía no hay reseñas</p>
          <p className="text-text-muted text-sm">
            {mine?.canReview
              ? "Sé la primera persona en contar qué te pareció."
              : "Las reseñas las escriben quienes cursan."}
          </p>
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-3">
          {others.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="border-border text-text hover:bg-surface-elevated inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Ver más reseñas
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Borrar tu reseña?"
        description="Se quita tu valoración y tu comentario del curso. Podés volver a escribir una cuando quieras."
        confirmLabel="Borrar reseña"
        variant="danger"
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/** Lo que va en el lugar de "mi reseña" según sesión e inscripción. */
function MyReviewSlot({
  courseSlug,
  sessionLoading,
  isAuthenticated,
  mine,
  children,
}: {
  courseSlug: string;
  sessionLoading: boolean;
  isAuthenticated: boolean;
  mine: MyCourseReview | null;
  children: React.ReactNode;
}) {
  if (sessionLoading) return null;

  if (!isAuthenticated) {
    return (
      <p className="bg-surface-elevated text-text-secondary rounded-lg px-4 py-3 text-sm">
        <Link
          href={`/login?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`}
          className="text-primary font-medium hover:underline"
        >
          Iniciá sesión
        </Link>{" "}
        e inscribite al curso para dejar tu reseña.
      </p>
    );
  }

  // Si ya tiene reseña se muestra aunque ya no esté inscripto (puede borrarla).
  if (mine && !mine.canReview && !mine.review) {
    return (
      <p className="bg-surface-elevated text-text-secondary rounded-lg px-4 py-3 text-sm">
        {mine.reason === "own_course"
          ? "Sos instructor de este curso: las reseñas quedan para quienes lo cursan."
          : "Inscribite al curso para dejar tu valoración y tu comentario."}
      </p>
    );
  }

  return <>{children}</>;
}
