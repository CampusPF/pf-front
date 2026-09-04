"use client";

import { useState } from "react";

import type { Course } from "@/types/course.types";
import ModuleAccordion from "@/components/course/ModuleAccordion";
import { formatDuration, getLessonsCount } from "@/lib/course-utils";
import { MOCK_COMPLETED_LESSON_IDS } from "@/data/progress.mock";

type Tab = "content" | "description" | "instructor";

const TABS: { value: Tab; label: string }[] = [
  { value: "content", label: "Contenido" },
  { value: "description", label: "Descripción" },
  { value: "instructor", label: "Instructor" },
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function CourseTabs({ course }: { course: Course }) {
  const [tab, setTab] = useState<Tab>("content");
  const modules = [...course.modules].sort((a, b) => a.order - b.order);

  return (
    <div>
      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Secciones del curso"
        className="border-border flex gap-1 border-b"
      >
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
            {modules.length} módulos · {getLessonsCount(course)} lecciones ·{" "}
            {formatDuration(course.durationHours * 60)} de contenido
          </p>

          <div className="space-y-3">
            {modules.map((courseModule, index) => (
              <ModuleAccordion
                key={courseModule.id}
                courseModule={courseModule}
                courseSlug={course.slug}
                defaultOpen={index === 0}
                completedLessonIds={MOCK_COMPLETED_LESSON_IDS}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Descripción ─────────────────────────────────────────── */}
      {tab === "description" && (
        <section id="panel-description" role="tabpanel" className="mt-6">
          <h2 className="text-text text-xl font-bold">{course.subtitle}</h2>
          <p className="text-text-secondary mt-3 leading-relaxed">
            {course.description}
          </p>

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

          <h3 className="text-text mt-8 font-semibold">Para quién es</h3>
          <p className="text-text-secondary mt-3 leading-relaxed">
            Nivel {course.levelLabel.toLowerCase()}. Son{" "}
            {course.durationHours} horas de contenido y {course.projectsCount}{" "}
            proyectos que quedan en tu portfolio. Si te trabás, el tutor de IA
            está disponible dentro de cada lección.
          </p>
        </section>
      )}

      {/* ── Instructor ──────────────────────────────────────────── */}
      {tab === "instructor" && (
        <section id="panel-instructor" role="tabpanel" className="mt-6">
          <div className="flex items-center gap-4">
            <span className="bg-primary/10 text-primary flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
              {initials(course.instructor.name)}
            </span>
            <div>
              <h2 className="text-text text-lg font-semibold">
                {course.instructor.name}
              </h2>
              <p className="text-text-muted text-sm">
                {course.instructor.title}
              </p>
            </div>
          </div>

          {/* TODO(campus): bio placeholder — hoy no viene en el mock de instructor. */}
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
