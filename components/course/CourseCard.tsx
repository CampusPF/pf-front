import Link from "next/link";
import { ArrowRight, Bookmark, Clock, FolderCode, Star } from "lucide-react";

import type { Course } from "@/types/course.types";
import { formatStudents } from "@/lib/course-utils";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group bg-surface border-border block cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* ── Portada ─────────────────────────────────────────────── */}
      <div
        className={`bg-gradient-to-br ${course.coverGradient} flex h-40 flex-col justify-between p-4`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            {course.categoryLabel}
          </span>
          {/* TODO(campus): guardar curso. Hoy es decorativo — un <button> real acá
              anidaría contenido interactivo dentro del <Link> que envuelve la card,
              así que cuando exista la acción hay que sacarlo fuera del Link. */}
          <span className="text-white/70 transition-colors duration-150 group-hover:text-white">
            <Bookmark className="size-4" aria-hidden />
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {course.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-black/30 px-2 py-0.5 font-mono text-xs text-white/90"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Cuerpo ──────────────────────────────────────────────── */}
      <div className="bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-text-muted flex items-center gap-1.5 text-sm">
            <Star className="fill-warning text-warning size-4" aria-hidden />
            <span className="text-text font-medium">{course.rating}</span>
            <span>({formatStudents(course.studentsCount)} alumnos)</span>
          </div>

          {course.isPremium && (
            <span className="bg-accent rounded-full px-2 py-0.5 text-xs font-medium text-white">
              Premium
            </span>
          )}
        </div>

        <h3 className="text-text group-hover:text-primary mt-2 font-semibold transition-colors duration-150">
          {course.title}
        </h3>
        <p className="text-text-muted mt-1 text-sm">{course.instructor.name}</p>

        <div className="border-border mt-4 flex items-center justify-between gap-2 border-t pt-3">
          <p className="text-text-muted flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {course.durationHours}hs
            </span>
            <span className="flex items-center gap-1.5">
              <FolderCode className="size-4" aria-hidden />
              {course.projectsCount} proyectos
            </span>
          </p>
          <ArrowRight
            className="text-primary size-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
