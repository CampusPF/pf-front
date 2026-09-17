import StarRating from "@/components/ui/StarRating";
import UserAvatar from "@/components/ui/UserAvatar";
import type { CourseReview } from "@/services/reviews/course-reviews.service";

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" });

/* Una edición dentro del minuto (el upsert toca updated_at) no es "editada". */
const EDITED_THRESHOLD_MS = 60_000;

export default function ReviewItem({
  review,
  isMine = false,
  actions,
}: {
  review: CourseReview;
  isMine?: boolean;
  /** Botones de editar/borrar para la reseña propia. */
  actions?: React.ReactNode;
}) {
  const created = new Date(review.createdAt);
  const edited = new Date(review.updatedAt).getTime() - created.getTime() > EDITED_THRESHOLD_MS;

  return (
    <article
      className={`rounded-xl border p-4 ${isMine ? "bg-primary-subtle/40 border-primary/30" : "bg-surface border-border"}`}
    >
      <header className="flex items-start gap-3">
        <UserAvatar name={review.author.name} avatarUrl={review.author.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-text flex flex-wrap items-center gap-x-2 text-sm font-semibold">
            <span className="truncate">{review.author.name}</span>
            {isMine && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[11px] font-medium">
                Tu reseña
              </span>
            )}
          </p>
          <p className="text-text-muted mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
            <StarRating value={review.rating} className="size-3.5" />
            <time dateTime={review.createdAt}>{DATE_FORMAT.format(created)}</time>
            {edited && <span>· editada</span>}
          </p>
        </div>
        {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
      </header>

      {review.comment && (
        <p className="text-text-secondary mt-3 text-sm leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>
      )}
    </article>
  );
}
