import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Lesson } from "@/types/course.types";
import { lessonHref } from "@/lib/course-utils";

const SECONDARY =
  "border-border text-text-secondary hover:bg-surface-elevated hover:text-text flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150";

const PRIMARY =
  "bg-primary-solid hover:bg-primary-solid-hover flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150";

export default function LessonNavigation({
  courseSlug,
  previous,
  next,
}: {
  courseSlug: string;
  previous: Lesson | null;
  next: Lesson | null;
}) {
  return (
    <div className="border-border mt-12 flex items-center justify-between gap-4 border-t pt-6">
      {previous ? (
        <Link
          href={lessonHref(courseSlug, previous.id)}
          className={`${SECONDARY} cursor-pointer`}
        >
          <ChevronLeft className="size-5" aria-hidden />
          Anterior
        </Link>
      ) : (
        <button type="button" disabled className={`${SECONDARY} cursor-not-allowed opacity-50`}>
          <ChevronLeft className="size-5" aria-hidden />
          Anterior
        </button>
      )}

      {next ? (
        <Link
          href={lessonHref(courseSlug, next.id)}
          className={`${PRIMARY} cursor-pointer`}
        >
          Siguiente
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      ) : (
        <Link href={`/courses/${courseSlug}`} className={`${PRIMARY} cursor-pointer`}>
          Finalizar módulo
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
