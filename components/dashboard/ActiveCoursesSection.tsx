"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ProgressBar from "@/components/course/ProgressBar";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import type { DashboardActiveCourse } from "@/services/dashboard/dashboard.view";

function ActiveCourseCard({ course }: { course: DashboardActiveCourse }) {
  return (
    <Link
      href={course.href}
      className="group bg-surface border-border block rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="bg-primary-subtle text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
          {course.categoryLabel}
        </span>
        {/* GET /course-enrollments/me no trae el total de lecciones del curso,
            así que sólo podemos mostrar las completadas. */}
        <span className="text-text-muted text-xs">
          {course.totalLessons != null
            ? `Lección ${course.completedLessons}/${course.totalLessons}`
            : `${course.completedLessons} ${
                course.completedLessons === 1
                  ? "lección completada"
                  : "lecciones completadas"
              }`}
        </span>
      </div>

      <h3 className="text-text group-hover:text-primary mt-3 font-semibold transition-colors duration-150">
        {course.title}
      </h3>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-text-muted text-xs">Progreso general</span>
          <span className="text-text text-xs font-semibold">
            {course.progressPercent}%
          </span>
        </div>
        <ProgressBar
          value={course.progressPercent}
          label={`Progreso de ${course.title}`}
        />
      </div>
    </Link>
  );
}

export default function ActiveCoursesSection() {
  const { data, isLoading, error } = useDashboardData();
  const courses = data?.activeCourses ?? [];

  return (
    <section aria-labelledby="active-courses-title" aria-busy={isLoading}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="active-courses-title"
          className="text-text flex items-center gap-2 text-lg font-semibold"
        >
          Mis cursos
          {!isLoading && !error && (
            <span className="bg-surface-elevated text-text-muted rounded-full px-2 py-0.5 text-xs font-medium">
              {courses.length} {courses.length === 1 ? "activo" : "activos"}
            </span>
          )}
        </h2>
        <Link
          href="/dashboard/mis-cursos"
          className="text-primary hover:text-primary-hover inline-flex items-center gap-1 text-sm font-medium transition-colors duration-150"
        >
          Ver todos
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-surface-elevated h-40 animate-pulse rounded-xl"
              aria-hidden
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
          No pudimos cargar tus cursos. Recargá la página en un momento.
        </p>
      ) : courses.length === 0 ? (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
          Todavía no te inscribiste en ningún curso.{" "}
          <Link href="/courses" className="text-primary font-medium underline">
            Explorá el catálogo
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <ActiveCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
