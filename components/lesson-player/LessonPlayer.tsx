"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Circle, Loader2, Lock } from "lucide-react";

import LessonTutorContext from "@/components/ai-tutor/LessonTutorContext";
import LessonContent from "@/components/lesson-player/LessonContent";
import LessonHeader from "@/components/lesson-player/LessonHeader";
import LessonNavigation from "@/components/lesson-player/LessonNavigation";
import LessonResources from "@/components/lesson-player/LessonResources";
import LessonSidebar from "@/components/lesson-player/LessonSidebar";
import {
  findModuleOfLesson,
  getAdjacentLessons,
  getLessonPosition,
} from "@/lib/course-utils";
import { getCourseBySlug, getLesson, loadSyllabus } from "@/services/courses/courses.service";
import {
  getCourseProgress,
  setLessonCompleted,
  type CourseProgress,
} from "@/services/progress/course-progress.service";
import type { Course, LessonDetail } from "@/types/course.types";

/* Reproductor de lecciones con datos reales:
   - curso por slug (público) + temario (con sesión, ver loadSyllabus);
   - lección: GET /lessons/:id → content/video, o `hasAccess:false`;
   - progreso: inscripción + lecciones completadas; "Marcar como completada"
     hace POST/PATCH a /lesson-progress y el back recalcula el %.

   Vive bajo learn/layout.tsx, que ya exige sesión. */

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; course: Course; lesson: LessonDetail };

export default function LessonPlayer({ slug, lessonId }: { slug: string; lessonId: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // El curso + temario se cachean entre lecciones: sólo cambia la lección.
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const base = await getCourseBySlug(slug);
        if (!base) {
          if (!cancelled) setState({ status: "not-found" });
          return;
        }
        const [full, fetchedProgress] = await Promise.all([
          loadSyllabus(base),
          getCourseProgress(base.id).catch(() => null),
        ]);
        if (cancelled) return;
        setCourse(full);
        setProgress(fetchedProgress);
      } catch (caught) {
        if (!cancelled) {
          setState({
            status: "error",
            message: caught instanceof Error ? caught.message : "No pudimos cargar el curso.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!course) return;
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });
    setSaveError(null);

    getLesson(course, lessonId)
      .then((lesson) => {
        if (cancelled) return;
        setState(lesson ? { status: "ready", course, lesson } : { status: "not-found" });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: caught instanceof Error ? caught.message : "No pudimos cargar la lección.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [course, lessonId]);

  const toggleCompleted = useCallback(async () => {
    if (!progress || !course) return;
    const completed = !progress.completedLessonIds.includes(lessonId);

    setIsSaving(true);
    setSaveError(null);
    try {
      await setLessonCompleted(progress, lessonId, completed);
      setProgress(await getCourseProgress(course.id));
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "No pudimos guardar tu progreso.");
    } finally {
      setIsSaving(false);
    }
  }, [progress, course, lessonId]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 pt-32">
        <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
        <span className="text-text-muted text-sm">Cargando lección…</span>
      </div>
    );
  }

  if (state.status !== "ready") {
    return (
      <div className="flex flex-1 flex-col items-center gap-3 px-6 pt-32 text-center">
        <AlertCircle className="text-text-muted size-10" aria-hidden />
        <h1 className="text-text text-xl font-semibold">
          {state.status === "not-found" ? "No encontramos esta lección" : "No pudimos cargar la lección"}
        </h1>
        {state.status === "error" && <p className="text-text-secondary text-sm">{state.message}</p>}
        <Link href={`/courses/${slug}`} className="text-primary text-sm font-medium hover:underline">
          Volver al curso
        </Link>
      </div>
    );
  }

  const { lesson } = state;
  const courseModule = findModuleOfLesson(state.course, lesson.id);
  const { previous, next } = getAdjacentLessons(state.course, lesson.id);
  const { index, total } = getLessonPosition(state.course, lesson.id);
  const isCompleted = progress?.completedLessonIds.includes(lesson.id) ?? false;

  return (
    <>
      <LessonTutorContext lessonTitle={lesson.title} />

      <LessonHeader
        courseSlug={state.course.slug}
        courseTitle={state.course.title}
        lessonIndex={index}
        lessonTotal={total}
        progressPercent={progress?.progressPercent ?? 0}
      />

      <div className="flex flex-1 pt-16">
        <LessonSidebar
          course={state.course}
          currentLessonId={lesson.id}
          completedLessonIds={progress?.completedLessonIds ?? []}
        />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-3xl px-6 py-8">
            {lesson.hasAccess ? (
              <LessonContent
                lesson={lesson}
                moduleOrder={courseModule?.order ?? 1}
                moduleTitle={courseModule?.title ?? ""}
                content={lesson.content ?? undefined}
              />
            ) : (
              <div className="border-border bg-surface my-8 rounded-2xl border p-10 text-center">
                <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
                  <Lock className="size-6" aria-hidden />
                </span>
                <h1 className="text-text mt-4 text-xl font-semibold">{lesson.title}</h1>
                <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm">
                  Esta lección es parte del contenido pago. Comprá el curso o
                  suscribite a Premium para verla.
                </p>
                <Link
                  href={`/courses/${state.course.slug}`}
                  className="bg-primary-solid hover:bg-primary-solid-hover mt-5 inline-block rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                >
                  Ver opciones de acceso
                </Link>
              </div>
            )}

            {lesson.hasAccess && (
              <div className="mt-8 flex flex-col items-start gap-2">
                {progress?.enrollmentId ? (
                  <button
                    type="button"
                    onClick={toggleCompleted}
                    disabled={isSaving}
                    aria-pressed={isCompleted}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                      isCompleted
                        ? "border-success/40 bg-success-subtle text-success"
                        : "border-border text-text hover:bg-surface-elevated"
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : isCompleted ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : (
                      <Circle className="size-4" aria-hidden />
                    )}
                    {isCompleted ? "Completada" : "Marcar como completada"}
                  </button>
                ) : (
                  <p className="text-text-muted text-sm">
                    Inscribite al curso para guardar tu progreso.
                  </p>
                )}
                {saveError && (
                  <p role="alert" className="text-danger text-xs">
                    {saveError}
                  </p>
                )}
              </div>
            )}

            <LessonResources lessonId={lesson.id} />

            <LessonNavigation courseSlug={state.course.slug} previous={previous} next={next} />
          </div>
        </main>
      </div>
    </>
  );
}
