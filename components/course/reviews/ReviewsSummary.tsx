import StarRating, { formatRating, reviewsLabel } from "@/components/ui/StarRating";
import type { CourseReviewsSummary } from "@/services/reviews/course-reviews.service";

const STARS = [5, 4, 3, 2, 1] as const;

/* Promedio grande + barras de distribución (estilo tienda de apps). Las barras
   son una lista con el número al costado: el ancho es decorativo, el dato se
   lee en texto. */
export default function ReviewsSummary({ summary }: { summary: CourseReviewsSummary }) {
  if (summary.average === null || summary.count === 0) return null;

  return (
    <div className="bg-surface border-border grid gap-6 rounded-xl border p-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:pr-6">
        <p className="text-text text-5xl font-bold">{formatRating(summary.average)}</p>
        <div className="mt-2 flex justify-center">
          <StarRating value={summary.average} />
        </div>
        <p className="text-text-muted mt-1 text-sm">{reviewsLabel(summary.count)}</p>
      </div>

      <ul className="space-y-1.5" aria-label="Distribución de valoraciones">
        {STARS.map((star) => {
          const count = summary.distribution[star] ?? 0;
          const percent = summary.count ? Math.round((count / summary.count) * 100) : 0;

          return (
            <li key={star} className="flex items-center gap-3 text-sm">
              <span className="text-text-secondary w-10 shrink-0 tabular-nums">{star} ★</span>
              <span className="bg-surface-elevated h-2 flex-1 overflow-hidden rounded-full" aria-hidden>
                <span className="bg-warning block h-full rounded-full" style={{ width: `${percent}%` }} />
              </span>
              <span className="text-text-muted w-10 shrink-0 text-right tabular-nums">
                <span className="sr-only">{star} estrellas: </span>
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
