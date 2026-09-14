"use client";

import { useState } from "react";
import { ChevronDown, Package } from "lucide-react";

import type { Module } from "@/types/course.types";
import { displayModuleTitle, formatDuration, getModuleMinutes, lessonsLabel } from "@/lib/course-utils";
import { canOpenLesson, hasFullCourseAccess, type LessonAccessContext } from "@/lib/lesson-access";
import LessonItem from "@/components/course/LessonItem";

export default function ModuleAccordion({
  courseModule,
  courseSlug,
  defaultOpen = false,
  completedLessonIds = [],
  access,
}: {
  courseModule: Module;
  courseSlug: string;
  defaultOpen?: boolean;
  completedLessonIds?: readonly string[];
  access: LessonAccessContext;
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
              Módulo {courseModule.order} · {displayModuleTitle(courseModule.title)}
            </span>
            <span className="text-text-muted mt-0.5 block text-sm">
              {lessonsLabel(lessons.length)}
              {/* Sin duración cargada (0 min) no se muestra. */}
              {getModuleMinutes(courseModule) > 0 &&
                ` · ${formatDuration(getModuleMinutes(courseModule))}`}
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
              isLocked={!canOpenLesson(lesson, access)}
              showFreeBadge={!hasFullCourseAccess(access)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
