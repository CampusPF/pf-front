import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

import ProgressBar from "@/components/course/ProgressBar";

/* TODO(campus): el player todavía vive bajo el root layout, que renderiza el
   Navbar fijo (h-16, z-50). Este header también es fixed h-16 z-50 y va después
   en el DOM, así que lo tapa por completo. La solución de fondo son route groups
   —(marketing) con Navbar/Footer y (app) sin ellos— pero eso implica mover
   app/page.tsx y app/layout.tsx, que quedaron fuera de este scaffolding.
   El Footer del root layout sigue apareciendo abajo de todo por el mismo motivo.

   Se queda como server component a propósito: no usa hooks ni handlers, y la
   regla del proyecto es 'use client' sólo cuando hace falta. */
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
          <div className="hidden w-40 items-center gap-2 sm:flex">
            <ProgressBar
              value={progressPercent}
              label={`Progreso de ${courseTitle}`}
            />
            <span className="text-text-muted text-xs tabular-nums">
              {progressPercent}%
            </span>
          </div>

          {/* TODO(campus): sin funcionalidad todavía (velocidad, subtítulos, tema). */}
          <button
            type="button"
            aria-label="Preferencias del reproductor"
            className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150"
          >
            <Settings className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
