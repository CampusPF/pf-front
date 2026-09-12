"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Compass } from "lucide-react";

import CourseCover from "@/components/course/CourseCover";
import ProgressBar from "@/components/course/ProgressBar";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import type { DashboardActiveCourse } from "@/services/dashboard/dashboard.view";

/* Listado completo de las inscripciones del usuario (GET /course-enrollments/me,
   ya agregado por DashboardDataProvider). El dashboard muestra un resumen de
   esto mismo; acá está todo, con filtro por estado.

   TODO(back): el total de lecciones por curso no viene en /me, así que se
   muestran las completadas sin el "de X" (ver dashboard.view.ts). */

type Filter = "all" | "in-progress" | "completed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "in-progress", label: "En curso" },
  { value: "completed", label: "Completados" },
];

function matchesFilter(course: DashboardActiveCourse, filter: Filter): boolean {
  if (filter === "completed") return course.isCompleted;
  if (filter === "in-progress") return !course.isCompleted;
  return true;
}

export default function MyCoursesView() {
  const { data, isLoading, error } = useDashboardData();
  const [filter, setFilter] = useState<Filter>("all");

  const courses = data?.activeCourses ?? [];
  const visible = courses.filter((course) => matchesFilter(course, filter));
  const completedCount = courses.filter((course) => course.isCompleted).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="text-text text-2xl font-bold md:text-3xl">Mis cursos</h1>
        <p className="text-text-secondary mt-1">
          {isLoading || error
            ? "Todo lo que estás cursando, en un solo lugar."
            : courses.length === 0
              ? "Todavía no te inscribiste en ningún curso."
              : `${courses.length} ${courses.length === 1 ? "curso" : "cursos"} · ${completedCount} ${
                  completedCount === 1 ? "completado" : "completados"
                }`}
        </p>
      </header>

      {/* El filtro sólo aporta si hay más de un curso. */}
      {!isLoading && !error && courses.length > 1 && (
        <div
          role="tablist"
          aria-label="Filtrar mis cursos"
          className="border-border mb-6 flex gap-1 border-b"
        >
          {FILTERS.map((option) => {
            const isActive = filter === option.value;
            const count = courses.filter((c) => matchesFilter(c, option.value)).length;

            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(option.value)}
                className={`-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "border-primary text-primary"
                    : "text-text-muted hover:text-text border-transparent"
                }`}
              >
                {option.label}
                <span className="text-text-muted ml-1.5 text-xs tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-surface-elevated h-72 animate-pulse rounded-xl" aria-hidden />
          ))}
        </div>
      ) : error ? (
        <p
          role="alert"
          className="bg-danger-subtle text-danger border-danger/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>No pudimos cargar tus cursos. Recargá la página en un momento.</span>
        </p>
      ) : courses.length === 0 ? (
        <EmptyState />
      ) : visible.length === 0 ? (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-10 text-center text-sm">
          {filter === "completed"
            ? "Todavía no terminaste ningún curso. ¡Vas por buen camino!"
            : "Ya completaste todos tus cursos. 🎉"}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((course) => (
            <MyCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyCourseCard({ course }: { course: DashboardActiveCourse }) {
  const started = course.progressPercent > 0 || course.completedLessons > 0;

  return (
    <Link
      href={course.href}
      className="group bg-surface border-border block overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <CourseCover course={course} className="h-32">
        <div className="flex h-full items-start justify-between gap-2 p-4">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            {course.categoryLabel}
          </span>
          {course.isCompleted && (
            <span className="bg-success flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Completado
            </span>
          )}
        </div>
      </CourseCover>

      <div className="p-4">
        <h2 className="text-text group-hover:text-primary font-semibold transition-colors duration-150">
          {course.title}
        </h2>
        <p className="text-text-muted mt-1 line-clamp-2 text-sm">
          {course.description || "Sin descripción."}
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-text-muted text-xs">
              {course.totalLessons != null
                ? `Lección ${course.completedLessons}/${course.totalLessons}`
                : `${course.completedLessons} ${
                    course.completedLessons === 1
                      ? "lección completada"
                      : "lecciones completadas"
                  }`}
            </span>
            <span className="text-text text-xs font-semibold tabular-nums">
              {course.progressPercent}%
            </span>
          </div>
          <ProgressBar value={course.progressPercent} label={`Progreso de ${course.title}`} />
        </div>

        <p className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
          {course.isCompleted ? "Repasar" : started ? "Continuar" : "Empezar"}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border-border rounded-2xl border border-dashed p-10 text-center">
      <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
        <BookOpen className="size-6" aria-hidden />
      </span>
      <h2 className="text-text mt-4 font-semibold">Todavía no tenés cursos</h2>
      <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm">
        Cuando te inscribas a un curso (o compres uno), va a aparecer acá con tu
        progreso para que puedas retomarlo donde lo dejaste.
      </p>
      <Link
        href="/courses"
        className="bg-primary-solid hover:bg-primary-solid-hover mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150"
      >
        <Compass className="size-4" aria-hidden />
        Explorar el catálogo
      </Link>
    </div>
  );
}
