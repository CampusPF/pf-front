"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, ListVideo, Play, X } from "lucide-react";

import type { Course } from "@/types/course.types";
import { formatDuration, lessonHref } from "@/lib/course-utils";

function SidebarContent({
  course,
  currentLessonId,
  completedLessonIds,
  onNavigate,
}: {
  course: Course;
  currentLessonId: string;
  completedLessonIds: readonly string[];
  onNavigate?: () => void;
}) {
  const modules = [...course.modules].sort((a, b) => a.order - b.order);

  return (
    <nav aria-label="Lecciones del curso" className="pb-8">
      {modules.map((courseModule) => (
        <div key={courseModule.id}>
          <p className="text-text-muted px-4 pt-5 pb-2 text-xs font-semibold tracking-wider uppercase">
            Módulo {courseModule.order} · {courseModule.title}
          </p>

          {[...courseModule.lessons]
            .sort((a, b) => a.order - b.order)
            .map((lesson) => {
              const isCurrent = lesson.id === currentLessonId;
              const isCompleted = completedLessonIds.includes(lesson.id);

              return (
                <Link
                  key={lesson.id}
                  href={lessonHref(course.slug, lesson.id)}
                  onClick={onNavigate}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex cursor-pointer items-start gap-2.5 border-l-2 px-4 py-2.5 text-sm transition-colors duration-150 ${
                    isCurrent
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "text-text-secondary hover:bg-surface-elevated hover:text-text border-transparent"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CircleCheck className="text-success size-4" aria-hidden />
                    ) : (
                      <Play
                        className={`size-4 ${isCurrent ? "text-primary" : "text-text-muted"}`}
                        aria-hidden
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2">{lesson.title}</span>
                    <span className="text-text-muted mt-0.5 block text-xs">
                      {formatDuration(lesson.durationMinutes)}
                    </span>
                  </span>
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}

export default function LessonSidebar({
  course,
  currentLessonId,
  completedLessonIds = [],
}: {
  course: Course;
  currentLessonId: string;
  completedLessonIds?: readonly string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ── Desktop ─────────────────────────────────────────────── */}
      <aside className="bg-surface border-border sticky top-16 hidden h-[calc(100vh-4rem)] w-80 shrink-0 overflow-y-auto border-r lg:block">
        <SidebarContent
          course={course}
          currentLessonId={currentLessonId}
          completedLessonIds={completedLessonIds}
        />
      </aside>

      {/* ── Trigger mobile ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir lecciones del curso"
        className="bg-surface border-border text-text-secondary hover:text-text fixed bottom-6 left-6 z-40 flex cursor-pointer items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium shadow-lg transition-colors duration-150 lg:hidden"
      >
        <ListVideo className="size-5" aria-hidden />
        Lecciones
      </button>

      {/* ── Drawer mobile ───────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar lecciones"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm"
          />

          <div className="bg-surface border-border absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border-r shadow-2xl">
            <div className="border-border flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4">
              <p className="text-text truncate font-medium">{course.title}</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar lecciones"
                className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SidebarContent
                course={course}
                currentLessonId={currentLessonId}
                completedLessonIds={completedLessonIds}
                onNavigate={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
