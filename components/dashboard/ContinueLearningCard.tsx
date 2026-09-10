"use client";

import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";

/* Card destacado "Continuá donde dejaste". Es un bloque de color sólido con
   texto blanco a propósito (no usa tokens de texto): ancla visualmente la
   home logueada.

   Datos: el curso, el % de avance y el link salen de GET /course-enrollments/me
   (inscripción más reciente sin terminar). El módulo, la próxima lección y la
   portada NO están disponibles en ese endpoint, así que se omiten y el
   gradiente es fijo (ver services/dashboard/dashboard.view.ts). */
export default function ContinueLearningCard() {
  const { data, isLoading } = useDashboardData();

  if (isLoading && !data) {
    return (
      <div
        className="bg-surface-elevated h-44 animate-pulse rounded-2xl"
        aria-hidden
      />
    );
  }

  const c = data?.continueLearning;

  if (!c) {
    return (
      <section
        aria-labelledby="continue-title"
        className="border-border bg-surface flex flex-col gap-3 rounded-2xl border border-dashed p-6 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 id="continue-title" className="text-text text-lg font-semibold">
            Todavía no empezaste ningún curso
          </h2>
          <p className="text-text-muted mt-1 text-sm">
            Explorá el catálogo y arrancá tu primera lección.
          </p>
        </div>
        <Link
          href="/courses"
          className="bg-primary-solid hover:bg-primary-solid-hover inline-flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150"
        >
          Ver cursos
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="continue-title"
      className={`bg-gradient-to-br ${c.coverGradient} shadow-lg relative overflow-hidden rounded-2xl p-6 md:p-7`}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        {/* Thumbnail */}
        <div className="hidden size-24 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm sm:flex">
          <Code2 className="size-10 text-white/90" aria-hidden />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white uppercase">
              En curso
            </span>
            {c.moduleLabel && (
              <span className="text-sm text-white/80">{c.moduleLabel}</span>
            )}
          </div>

          <h2
            id="continue-title"
            className="mt-2 text-2xl font-bold text-white"
          >
            {c.courseTitle}
          </h2>
          {c.nextLessonTitle && (
            <p className="mt-1 text-sm text-white/80">
              Próxima lección:{" "}
              <span className="font-medium text-white">{c.nextLessonTitle}</span>
            </p>
          )}

          {/* Progreso */}
          <div className="mt-4 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuenow={c.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de ${c.courseTitle}`}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25"
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-300"
                style={{ width: `${c.progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-white">
              {c.progressPercent}%
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <Link
            href={c.href}
            className="text-primary inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold transition-transform duration-200 hover:scale-[1.03]"
          >
            Continuar
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
