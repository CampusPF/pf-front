"use client";

import { useState } from "react";
import { ChevronDown, Package } from "lucide-react";

import type { Module } from "@/types/course.types";
import { formatDuration, getModuleMinutes } from "@/lib/course-utils";
import LessonItem from "@/components/course/LessonItem";

export default function ModuleAccordion({
  courseModule,
  courseSlug,
  defaultOpen = false,
  completedLessonIds = [],
}: {
  courseModule: Module;
  courseSlug: string;
  defaultOpen?: boolean;
  completedLessonIds?: readonly string[];
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const lessons = [...courseModule.lessons].sort((a, b) => a.order - b.order);
  const panelId = `modulo-${courseModule.id}`;

  return (
    <div className="bg-surface border-border overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="hover:bg-surface-elevated flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left transition-colors duration-150"
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Package className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="text-text block font-semibold">
              Módulo {courseModule.order} · {courseModule.title}
            </span>
            <span className="text-text-muted mt-0.5 block text-sm">
              {lessons.length} lecciones ·{" "}
              {formatDuration(getModuleMinutes(courseModule))}
            </span>
          </span>
        </span>

        <ChevronDown
          className={`text-text-muted size-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div id={panelId} className="border-border border-t p-2">
          {lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              courseSlug={courseSlug}
              isCompleted={completedLessonIds.includes(lesson.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
