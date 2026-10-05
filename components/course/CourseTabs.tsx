"use client";

import { useState } from "react";
import { Package } from "lucide-react";

import ModuleAccordion from "@/components/course/ModuleAccordion";
import CourseReviews from "@/components/course/reviews/CourseReviews";
import CourseForum from "@/components/forum/CourseForum";
import UserAvatar from "@/components/ui/UserAvatar";
import { useCourseLearning } from "@/components/course/CourseLearningProvider";
import {
  displayModuleTitle,
  formatDuration,
  getLessonsCount,
  lessonsLabel,
  modulesLabel,
} from "@/lib/course-utils";

type Tab = "content" | "description" | "instructor" | "reviews" | "forum";

const TABS: { value: Tab; label: string }[] = [
  { value: "content", label: "Contenido" },
  { value: "description", label: "Descripción" },
  { value: "instructor", label: "Instructor" },
  { value: "reviews", label: "Reseñas" },
  { value: "forum", label: "Foro" },
];

export default function CourseTabs() {
  const { course, progress, access } = useCourseLearning();
  const [tab, setTab] = useState<Tab>("content");
  const modules = [...course.modules].sort((a, b) => a.order - b.order);
  const lessonsPending = course.syllabusStatus === "modules-only";

  return (
    <div>
      {/* ── Tabs ────────────────────────────────────────────────── */}
      {/* En 375px las 4 pestañas (más el contador de reseñas) no entran: se
          desplazan dentro de la barra en lugar de ensanchar toda la página.
          Mismo patrón que AdminNav (borde en el div interno por el -mb-px). */}
      <div className="overflow-x-auto scrollbar-none">
      <div role="tablist" aria-label="Secciones del curso" className="border-border flex w-max min-w-full gap-1 border-b">
        {TABS.map((item) => {
          const isActive = tab === item.value;

          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${item.value}`}
              onClick={() => setTab(item.value)}
              className={`-mb-px cursor-pointer border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 sm:px-4 ${
                isActive
                  ? "border-primary text-primary"
                  : "text-text-muted hover:text-text border-transparent"
              }`}
            >
              {item.label}
              {item.value === "reviews" && course.reviewsCount > 0 && (
                <span className="text-text-muted ml-1.5 text-xs tabular-nums">({course.reviewsCount})</span>
              )}
            </button>
          );
        })}
      </div>
      </div>

      {/* ── Contenido ───────────────────────────────────────────── */}
      {tab === "content" && (
        <section id="panel-content" role="tabpanel" className="mt-6">
          <p className="text-text-muted mb-4 text-sm">
            {modulesLabel(modules.length)}
            {!lessonsPending && ` · ${lessonsLabel(getLessonsCount(course))}`}
            {course.durationHours !== null && ` · ${formatDuration(course.durationHours * 60)} de contenido`}
          </p>

          {modules.length === 0 && (
            <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
              El temario de este curso se está armando.
            </p>
          )}

          {/* Ya no hace falta el aviso de "iniciá sesión para ver las
              lecciones": el temario viene completo y es público (ver
              `GET /courses/slug/:slug` en pf-back). `lessonsPending` queda
              como fallback por si un curso llega sin lecciones desde otro
              camino, pero en el detalle no se da. */}
          <div className="space-y-3">
            {lessonsPending
              ? modules.map((courseModule) => (
                  <div
                    key={courseModule.id}
                    className="bg-surface border-border flex items-center gap-3 rounded-xl border px-4 py-4"
                  >
                    <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Package className="size-5" aria-hidden />
                    </span>
                    <span className="text-text font-semibold">
                      Módulo {courseModule.order} · {displayModuleTitle(courseModule.title)}
                    </span>
                  </div>
                ))
              : modules.map((courseModule, index) => (
                  <ModuleAccordion
                    key={courseModule.id}
                    courseModule={courseModule}
                    courseSlug={course.slug}
                    defaultOpen={index === 0}
                    completedLessonIds={progress?.completedLessonIds ?? []}
                    access={access}
                  />
                ))}
          </div>
        </section>
      )}

      {/* ── Descripción ─────────────────────────────────────────── */}
      {tab === "description" && (
        <section id="panel-description" role="tabpanel" className="mt-6">
          {course.subtitle && <h2 className="text-text text-xl font-bold">{course.subtitle}</h2>}
          <p className="text-text-secondary mt-3 leading-relaxed whitespace-pre-line">
            {course.description || "Este curso todavía no tiene descripción."}
          </p>

          {course.tags.length > 0 && (
            <>
              <h3 className="text-text mt-8 font-semibold">Tecnologías que vas a usar</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-surface-elevated border-border text-text-secondary rounded-lg border px-3 py-1 font-mono text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}

          <h3 className="text-text mt-8 font-semibold">Para quién es</h3>
          <p className="text-text-secondary mt-3 leading-relaxed">
            Nivel {course.levelLabel.toLowerCase()}.
            {course.durationHours !== null && ` Son ${formatDuration(course.durationHours * 60)} de contenido.`}{" "}
            Si te trabás, el tutor de IA está disponible dentro de cada lección.
          </p>
        </section>
      )}

      {/* ── Reseñas ─────────────────────────────────────────────── */}
      {tab === "reviews" && (
        <section id="panel-reviews" role="tabpanel" className="mt-6">
          <CourseReviews />
        </section>
      )}

      {/* ── Foro ────────────────────────────────────────────────── */}
      {tab === "forum" && (
        <section id="panel-forum" role="tabpanel" className="mt-6">
          <CourseForum />
        </section>
      )}

      {/* ── Instructor ──────────────────────────────────────────── */}
      {tab === "instructor" && (
        <section id="panel-instructor" role="tabpanel" className="mt-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={course.instructor.name}
              avatarUrl={course.instructor.avatarUrl}
              className="size-16 text-lg"
            />
            <div>
              <h2 className="text-text text-lg font-semibold">{course.instructor.name}</h2>
              {course.instructor.title && (
                <p className="text-text-muted text-sm">{course.instructor.title}</p>
              )}
            </div>
          </div>

          {/* Acá iba una bio fija, igual para todos los docentes: en un
              catálogo con varios instructores se nota que es de relleno. El
              User del back no tiene `bio`; cuando la tenga, va acá.
              TODO(back): agregar `bio` al User y mostrarla. */}
        </section>
      )}
    </div>
  );
}
