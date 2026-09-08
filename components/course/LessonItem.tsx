import Link from "next/link";
import { CircleCheck, Lock, Play } from "lucide-react";

import type { Lesson } from "@/types/course.types";
import { formatDuration, lessonHref } from "@/lib/course-utils";

export default function LessonItem({
  lesson,
  courseSlug,
  isCompleted = false,
}: {
  lesson: Lesson;
  courseSlug: string;
  isCompleted?: boolean;
}) {
  return (
    <Link
      /* La autenticación ya la resuelve middleware.ts para todo /courses/*.
         TODO(campus): las lecciones pagas linkean igual que las gratis; falta
         el gate de pago/checkout para lecciones no gratuitas (autorización,
         no autenticación). */
      href={lessonHref(courseSlug, lesson.id)}
      className="group hover:bg-surface-elevated flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150"
    >
      <span className="text-text-muted w-4 shrink-0 text-right text-xs tabular-nums">
        {lesson.order}
      </span>

      <span className="shrink-0">
        {isCompleted ? (
          <CircleCheck className="text-success size-4" aria-hidden />
        ) : lesson.isFree ? (
          <Play className="text-primary size-4" aria-hidden />
        ) : (
          <Lock className="text-text-muted size-4" aria-hidden />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="text-text group-hover:text-primary block truncate text-sm transition-colors duration-150">
          {lesson.title}
        </span>
        <span className="text-text-muted block text-xs">
          {formatDuration(lesson.durationMinutes)}
        </span>
      </span>

      {lesson.isFree && (
        <span className="bg-success/10 text-success shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
          Gratis
        </span>
      )}
    </Link>
  );
}
