import Link from "next/link";
import { CircleCheck, Lock, Play } from "lucide-react";

import type { Lesson } from "@/types/course.types";
import { formatDuration, lessonHref } from "@/lib/course-utils";

const ROW = "flex items-center gap-3 rounded-lg px-3 py-2.5";

export default function LessonItem({
  lesson,
  courseSlug,
  isCompleted = false,
  isLocked,
  showFreeBadge,
}: {
  lesson: Lesson;
  courseSlug: string;
  isCompleted?: boolean;
  /** Sin acceso (ver lib/lesson-access.ts): no linkea a la lección. */
  isLocked: boolean;
  /** El badge "Gratis" sólo informa a quien todavía no tiene el curso. */
  showFreeBadge: boolean;
}) {
  const body = (
    <>
      <span className="text-text-muted w-4 shrink-0 text-right text-xs tabular-nums">
        {lesson.order}
      </span>

      <span className="shrink-0">
        {isCompleted ? (
          <CircleCheck className="text-success size-4" aria-hidden />
        ) : isLocked ? (
          <Lock className="text-text-muted size-4" aria-hidden />
        ) : (
          <Play className="text-primary size-4" aria-hidden />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm transition-colors duration-150 ${
            isLocked ? "text-text-muted" : "text-text group-hover:text-primary"
          }`}
        >
          {lesson.title}
        </span>
        {/* Sin duración cargada (0 min) no se muestra. */}
        {lesson.durationMinutes > 0 && (
          <span className="text-text-muted block text-xs">
            {formatDuration(lesson.durationMinutes)}
          </span>
        )}
      </span>

      {showFreeBadge && lesson.isFree && (
        <span className="bg-success/10 text-success shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
          Gratis
        </span>
      )}
    </>
  );

  // Bloqueada: ni siquiera se linkea. El CTA del hero es el camino para
  // desbloquearla (inscribirse gratis, comprar o suscribirse).
  if (isLocked) {
    return (
      <div className={`${ROW} cursor-not-allowed`} aria-disabled="true">
        {body}
        <span className="sr-only">(bloqueada)</span>
      </div>
    );
  }

  return (
    <Link
      href={lessonHref(courseSlug, lesson.id)}
      className={`${ROW} group hover:bg-surface-elevated cursor-pointer transition-colors duration-150`}
    >
      {body}
    </Link>
  );
}
