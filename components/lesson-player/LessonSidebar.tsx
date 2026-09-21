"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, ClipboardCheck, ListVideo, Lock, Play, X } from "lucide-react";

import type { Course } from "@/types/course.types";
import type { CourseCheckpoint } from "@/types/quiz.types";
import { displayModuleTitle, formatDuration, lessonHref, quizHref } from "@/lib/course-utils";
import { canOpenLesson, type LessonAccessContext } from "@/lib/lesson-access";

function SidebarContent({
  course,
  currentLessonId,
  completedLessonIds,
  access,
  nextLessonId,
  onAdvance,
  checkpoints,
  onNavigate,
}: {
  course: Course;
  currentLessonId: string;
  completedLessonIds: readonly string[];
  access: LessonAccessContext;
  nextLessonId: string | null;
  onAdvance: (href: string) => void;
  checkpoints: readonly CourseCheckpoint[];
  onNavigate?: () => void;
}) {
  const modules = [...course.modules].sort((a, b) => a.order - b.order);

  return (
    <nav aria-label="Lecciones del curso" className="pb-8">
      {modules.map((courseModule) => (
        <div key={courseModule.id}>
          <p className="text-text-muted px-4 pt-5 pb-2 text-xs font-semibold tracking-wider uppercase">
            Módulo {courseModule.order} · {displayModuleTitle(courseModule.title)}
          </p>

          {[...courseModule.lessons]
            .sort((a, b) => a.order - b.order)
            .map((lesson) => {
              const isCurrent = lesson.id === currentLessonId;
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isLocked = !canOpenLesson(lesson, access);

              const body = (
                <>
                  <span className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CircleCheck className="text-success size-4" aria-hidden />
                    ) : isLocked ? (
                      <Lock className="text-text-muted size-4" aria-hidden />
                    ) : (
                      <Play
                        className={`size-4 ${isCurrent ? "text-primary" : "text-text-muted"}`}
                        aria-hidden
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2">{lesson.title}</span>
                    {lesson.durationMinutes > 0 && (
                      <span className="text-text-muted mt-0.5 block text-xs">
                        {formatDuration(lesson.durationMinutes)}
                      </span>
                    )}
                  </span>
                </>
              );

              // Bloqueada y no es la actual: no se linkea. (La actual puede
              // estar bloqueada si se llegó por URL; ahí el reproductor ya
              // muestra el candado con las opciones de acceso.)
              if (isLocked && !isCurrent) {
                return (
                  <div
                    key={lesson.id}
                    aria-disabled="true"
                    className="text-text-muted flex cursor-not-allowed items-start gap-2.5 border-l-2 border-transparent px-4 py-2.5 text-sm"
                  >
                    {body}
                    <span className="sr-only">(bloqueada)</span>
                  </div>
                );
              }

              return (
                <Link
                  key={lesson.id}
                  href={lessonHref(course.slug, lesson.id)}
                  onClick={(event) => {
                    onNavigate?.();
                    // Ir a la siguiente completa la actual, igual que "Siguiente".
                    if (lesson.id !== nextLessonId) return;
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                    event.preventDefault();
                    onAdvance(lessonHref(course.slug, lesson.id));
                  }}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex cursor-pointer items-start gap-2.5 border-l-2 px-4 py-2.5 text-sm transition-colors duration-150 ${
                    isCurrent
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "text-text-secondary hover:bg-surface-elevated hover:text-text border-transparent"
                  }`}
                >
                  {body}
                </Link>
              );
            })}

          {/* Checkpoint del módulo, si tiene: cierra el módulo en el temario. */}
          {checkpoints
            .filter((checkpoint) => checkpoint.moduleId === courseModule.id)
            .map((checkpoint) => (
              <CheckpointLink
                key={checkpoint.quizId}
                checkpoint={checkpoint}
                courseSlug={course.slug}
                onNavigate={onNavigate}
              />
            ))}
        </div>
      ))}

      {/* Checkpoint de fin de curso (moduleId null): no cuelga de ningún
          módulo, así que cierra el temario entero. */}
      {checkpoints
        .filter((checkpoint) => checkpoint.moduleId === null)
        .map((checkpoint) => (
          <div key={checkpoint.quizId} className="border-border border-b py-1">
            <CheckpointLink
              checkpoint={checkpoint}
              courseSlug={course.slug}
              onNavigate={onNavigate}
            />
          </div>
        ))}
    </nav>
  );
}

function CheckpointLink({
  checkpoint,
  courseSlug,
  onNavigate,
}: {
  checkpoint: CourseCheckpoint;
  courseSlug: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={quizHref(courseSlug, checkpoint.quizId)}
      onClick={onNavigate}
      className="text-text-secondary hover:bg-surface-elevated hover:text-text flex cursor-pointer items-start gap-2.5 border-l-2 border-transparent px-4 py-2.5 text-sm transition-colors duration-150"
    >
      {checkpoint.passed ? (
        <CircleCheck className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <ClipboardCheck className="text-text-muted mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 flex-1">
        {checkpoint.title}
        <span className="text-text-muted mt-0.5 block text-xs">
          {checkpoint.passed ? "Aprobado" : "Pendiente"}
        </span>
      </span>
    </Link>
  );
}

export default function LessonSidebar({
  course,
  currentLessonId,
  completedLessonIds = [],
  access,
  nextLessonId,
  onAdvance,
  checkpoints = [],
}: {
  course: Course;
  currentLessonId: string;
  completedLessonIds?: readonly string[];
  access: LessonAccessContext;
  nextLessonId: string | null;
  onAdvance: (href: string) => void;
  checkpoints?: readonly CourseCheckpoint[];
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
          access={access}
          nextLessonId={nextLessonId}
          onAdvance={onAdvance}
          checkpoints={checkpoints}
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
                access={access}
                nextLessonId={nextLessonId}
                onAdvance={onAdvance}
                checkpoints={checkpoints}
                onNavigate={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
