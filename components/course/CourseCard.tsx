import Link from "next/link";
import { ArrowRight, BarChart3, Clock, FolderCode, Star } from "lucide-react";

import type { Course } from "@/types/course.types";
import { formatStudents } from "@/lib/course-utils";
import { formatPrice } from "@/types/checkout";
import CourseCover from "@/components/course/CourseCover";

/* Los datos que el back todavía no tiene (rating, alumnos, proyectos, tags)
   llegan en null/vacío para los cursos reales y se ocultan. */
export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group bg-surface border-border block cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* ── Portada ─────────────────────────────────────────────── */}
      <CourseCover course={course} className="h-40">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
              {course.categoryLabel}
            </span>
            {course.isPremium && (
              <span className="bg-accent-solid rounded-full px-2 py-0.5 text-xs font-medium text-white">
                Premium
              </span>
            )}
          </div>

          {course.tags.length > 0 && (
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
          )}
        </div>
      </CourseCover>

      {/* ── Cuerpo ──────────────────────────────────────────────── */}
      <div className="bg-surface p-4">
        <div className="text-text-muted flex items-center justify-between gap-2 text-sm">
          {course.rating !== null ? (
            <span className="flex items-center gap-1.5">
              <Star className="fill-warning text-warning size-4" aria-hidden />
              <span className="text-text font-medium">{course.rating}</span>
              {course.studentsCount !== null && (
                <span>({formatStudents(course.studentsCount)} alumnos)</span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <BarChart3 className="size-4" aria-hidden />
              {course.levelLabel}
            </span>
          )}

          <span className="text-text font-semibold">
            {course.isPremium ? formatPrice(course.priceInCents, course.currency) : "Gratis"}
          </span>
        </div>

        <h3 className="text-text group-hover:text-primary mt-2 font-semibold transition-colors duration-150">
          {course.title}
        </h3>
        <p className="text-text-muted mt-1 text-sm">{course.instructor.name}</p>

        <div className="border-border mt-4 flex items-center justify-between gap-2 border-t pt-3">
          <p className="text-text-muted flex items-center gap-3 text-sm">
            {course.durationHours !== null && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden />
                {course.durationHours}hs
              </span>
            )}
            {course.projectsCount !== null && (
              <span className="flex items-center gap-1.5">
                <FolderCode className="size-4" aria-hidden />
                {course.projectsCount} proyectos
              </span>
            )}
            {course.durationHours === null && course.projectsCount === null && (
              <span className="line-clamp-1">{course.description}</span>
            )}
          </p>
          <ArrowRight
            className="text-primary size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
