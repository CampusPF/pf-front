"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Package } from "lucide-react";

import ModuleAccordion from "@/components/course/ModuleAccordion";
import UserAvatar from "@/components/ui/UserAvatar";
import { useCourseLearning } from "@/components/course/CourseLearningProvider";
import { formatDuration, getLessonsCount } from "@/lib/course-utils";

type Tab = "content" | "description" | "instructor";

const TABS: { value: Tab; label: string }[] = [
  { value: "content", label: "Contenido" },
  { value: "description", label: "Descripción" },
  { value: "instructor", label: "Instructor" },
];

export default function CourseTabs() {
  const { course, progress, isAuthenticated, isLoading } = useCourseLearning();
  const [tab, setTab] = useState<Tab>("content");
  const modules = [...course.modules].sort((a, b) => a.order - b.order);
  const lessonsPending = course.syllabusStatus === "modules-only";

  return (
    <div>
      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div role="tablist" aria-label="Secciones del curso" className="border-border flex gap-1 border-b">
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
              className={`-mb-px cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "border-primary text-primary"
                  : "text-text-muted hover:text-text border-transparent"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ── Contenido ───────────────────────────────────────────── */}
      {tab === "content" && (
        <section id="panel-content" role="tabpanel" className="mt-6">
          <p className="text-text-muted mb-4 text-sm">
            {modules.length} módulos
            {!lessonsPending && ` · ${getLessonsCount(course)} lecciones`}
            {course.durationHours !== null && ` · ${formatDuration(course.durationHours * 60)} de contenido`}
          </p>

          {modules.length === 0 && (
            <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
              El temario de este curso se está armando.
            </p>
          )}

          {/* TODO(back): `GET /courses/:id` no trae las lecciones y `GET
              /lessons` pide sesión, así que sin login sólo se ven los módulos. */}
          {lessonsPending && !isLoading && !isAuthenticated && modules.length > 0 && (
            <p className="bg-surface-elevated text-text-secondary mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm">
              <Lock className="size-4 shrink-0" aria-hidden />
              <span>
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`}
                  className="text-primary font-medium hover:underline"
                >
                  Iniciá sesión
                </Link>{" "}
                para ver las lecciones de cada módulo.
              </span>
            </p>
          )}

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
                      Módulo {courseModule.order} · {courseModule.title}
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
            {course.durationHours !== null && ` Son ${course.durationHours} horas de contenido.`}{" "}
            Si te trabás, el tutor de IA está disponible dentro de cada lección.
          </p>
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

          {/* TODO(back): el User no tiene bio. Texto fijo mientras tanto. */}
          <p className="text-text-secondary mt-6 leading-relaxed">
            Arma cursos con el mismo criterio con el que revisa pull requests:
            menos teoría suelta, más decisiones explicadas. Cada módulo cierra
            con algo que podés mostrar.
          </p>
        </section>
      )}
    </div>
  );
}
