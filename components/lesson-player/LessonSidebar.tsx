"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, ClipboardCheck, ListVideo, Lock, Play, X } from "lucide-react";

import type { Course } from "@/types/course.types";
import type { CourseProgression, ModuleGate } from "@/types/progression.types";
import type { CourseCheckpoint } from "@/types/quiz.types";
import { moduleGate } from "@/services/progress/course-progression.service";
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
  progression,
  onNavigate,
}: {
  course: Course;
  currentLessonId: string;
  completedLessonIds: readonly string[];
  access: LessonAccessContext;
  nextLessonId: string | null;
  onAdvance: (href: string) => void;
  checkpoints: readonly CourseCheckpoint[];
  progression: CourseProgression | null;
  onNavigate?: () => void;
}) {
  const modules = [...course.modules].sort((a, b) => a.order - b.order);

  return (
    <nav aria-label="Lecciones del curso" className="pb-8">
      {modules.map((courseModule) => {
        const gate = moduleGate(progression, courseModule.id);
        // Sin progresión cargada no se bloquea nada: el back es el que corta.
        const moduleLocked = gate ? !gate.lessonsUnlocked : false;

        return (
        <div key={courseModule.id}>
          <p className="text-text-muted flex items-center gap-1.5 px-4 pt-5 pb-2 text-xs font-semibold tracking-wider uppercase">
            {moduleLocked && <Lock className="size-3 shrink-0" aria-hidden />}
            <span className="min-w-0 truncate">
              Módulo {courseModule.order} · {displayModuleTitle(courseModule.title)}
            </span>
          </p>
          {moduleLocked && gate?.lockedReason && (
            <p className="text-text-muted px-4 pb-2 text-xs normal-case">{gate.lockedReason}</p>
          )}

          {[...courseModule.lessons]
            .sort((a, b) => a.order - b.order)
            .map((lesson) => {
              const isCurrent = lesson.id === currentLessonId;
              const isCompleted = completedLessonIds.includes(lesson.id);
              // Dos candados distintos: el de acceso (pago/inscripción) y el
              // de progresión (no llegó todavía). Cualquiera cierra la lección.
              const isLocked = moduleLocked || !canOpenLesson(lesson, access);

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
                locked={gate ? !gate.checkpointUnlocked : false}
                lockedReason={checkpointReason(gate)}
              />
            ))}
        </div>
        );
      })}

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
              locked={progression?.finalCheckpoint ? !progression.finalCheckpoint.unlocked : false}
              lockedReason={progression?.finalCheckpoint?.lockedReason ?? null}
            />
          </div>
        ))}
    </nav>
  );
}

/** Por qué no se puede rendir todavía el checkpoint de este módulo. */
function checkpointReason(gate: ModuleGate | null): string | null {
  if (!gate || gate.checkpointUnlocked) return null;
  if (!gate.lessonsUnlocked) return gate.lockedReason;

  const pending = gate.totalLessons - gate.completedLessons;
  if (pending <= 0) return gate.lockedReason;

  return pending === 1
    ? "Te falta 1 lección del módulo"
    : `Te faltan ${pending} lecciones del módulo`;
}

function CheckpointLink({
  checkpoint,
  courseSlug,
  onNavigate,
  locked = false,
  lockedReason = null,
}: {
  checkpoint: CourseCheckpoint;
  courseSlug: string;
  onNavigate?: () => void;
  locked?: boolean;
  lockedReason?: string | null;
}) {
  const icon = checkpoint.passed ? (
    <CircleCheck className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
  ) : locked ? (
    <Lock className="text-text-muted mt-0.5 size-4 shrink-0" aria-hidden />
  ) : (
    <ClipboardCheck className="text-text-muted mt-0.5 size-4 shrink-0" aria-hidden />
  );

  const label = (
    <span className="min-w-0 flex-1">
      {checkpoint.title}
      <span className="text-text-muted mt-0.5 block text-xs">
        {checkpoint.passed
          ? "Aprobado"
          : locked
            ? (lockedReason ?? "Bloqueado")
            : "Pendiente"}
      </span>
    </span>
  );

  /* Bloqueado no se linkea: entrar igual daría 403 del back, y un link que
     lleva a un error no es navegación, es una trampa. */
  if (locked && !checkpoint.passed) {
    return (
      <div
        aria-disabled="true"
        className="text-text-muted flex cursor-not-allowed items-start gap-2.5 border-l-2 border-transparent px-4 py-2.5 text-sm"
      >
        {icon}
        {label}
        <span className="sr-only">(bloqueado)</span>
      </div>
    );
  }

  return (
    <Link
      href={quizHref(courseSlug, checkpoint.quizId)}
      onClick={onNavigate}
      className="text-text-secondary hover:bg-surface-elevated hover:text-text flex cursor-pointer items-start gap-2.5 border-l-2 border-transparent px-4 py-2.5 text-sm transition-colors duration-150"
    >
      {icon}
      {label}
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
  progression = null,
}: {
  course: Course;
  currentLessonId: string;
  completedLessonIds?: readonly string[];
  access: LessonAccessContext;
  nextLessonId: string | null;
  onAdvance: (href: string) => void;
  checkpoints?: readonly CourseCheckpoint[];
  /** Sin progresión el temario se dibuja sin candados: corta el back. */
  progression?: CourseProgression | null;
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
          progression={progression}
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
                progression={progression}
                onNavigate={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
