import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AskTutorButton from "@/components/ai-tutor/AskTutorButton";
import ProgressBar from "@/components/course/ProgressBar";
import NotificationsBell from "@/components/notifications/NotificationsBell";

/* Única barra del reproductor: el route group (player) no tiene Navbar ni
   Footer. El botón del tutor vive acá (AskTutorButton) en vez del botón
   flotante, que en el reproductor tapaba la navegación de la lección. */
export default function LessonHeader({
  courseSlug,
  courseTitle,
  lessonIndex,
  lessonTotal,
  progressPercent,
}: {
  courseSlug: string;
  courseTitle: string;
  lessonIndex: number;
  lessonTotal: number;
  progressPercent: number;
}) {
  return (
    <header className="bg-surface border-border fixed inset-x-0 top-0 z-50 h-16 border-b">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/courses/${courseSlug}`}
            className="text-text-secondary hover:text-text hover:bg-surface-elevated flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Volver</span>
          </Link>

          <p className="text-text-muted min-w-0 truncate text-sm">
            <span className="text-text font-medium">{courseTitle}</span>
            <span className="hidden sm:inline">
              {" "}
              · Lección {lessonIndex} de {lessonTotal}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <AskTutorButton />
          <div className="hidden w-40 items-center gap-2 sm:flex">
            <ProgressBar
              value={progressPercent}
              label={`Progreso de ${courseTitle}`}
            />
            <span className="text-text-muted text-xs tabular-nums">
              {progressPercent}%
            </span>
          </div>

          {/* La campana también acá. El reproductor es la pantalla donde más
              tiempo se pasa, y hasta ahora era la única sin forma de ver un
              aviso del foro o un mensaje. Es un ícono, no un panel abierto:
              no compite con la lección hasta que lo tocás. */}
          <NotificationsBell />
        </div>
      </div>
    </header>
  );
}
