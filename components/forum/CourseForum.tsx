"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useCourseLearning } from "@/components/course/CourseLearningProvider";
import ThreadForm from "@/components/forum/ThreadForm";
import ThreadList from "@/components/forum/ThreadList";
import { buildLessonAccess, hasFullCourseAccess } from "@/lib/lesson-access";
import {
  createCourseThread,
  listCourseThreads,
  type ThreadInput,
} from "@/services/forums/forums.service";

/* Pestaña "Foro" del detalle del curso. El back es quien decide el acceso; acá
   sólo se evita mostrar el formulario a quien seguro no puede participar. */
export default function CourseForum() {
  const { course, progress } = useCourseLearning();
  const { user, isAuthenticated } = useAuth();
  const [composing, setComposing] = useState(false);
  const [version, setVersion] = useState(0);

  const access = buildLessonAccess(user, progress, course);
  const canParticipate = hasFullCourseAccess(access);

  const loadThreads = useCallback(
    (page: number, signal: AbortSignal) => listCourseThreads(course.id, page, signal),
    // `version` fuerza una recarga después de publicar un hilo nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [course.id, version],
  );

  async function publish(input: ThreadInput) {
    await createCourseThread(course.id, input);
    setComposing(false);
    setVersion((current) => current + 1);
  }

  if (!isAuthenticated) {
    return (
      <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
        <Link href={`/login?redirect=/courses/${course.slug}`} className="text-primary underline">
          Iniciá sesión
        </Link>{" "}
        para ver el foro del curso.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {canParticipate ? (
        <div className="flex justify-end">
          {composing ? null : (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="bg-primary-solid hover:bg-primary-solid-hover cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white"
            >
              Nuevo hilo
            </button>
          )}
        </div>
      ) : (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-4 text-center text-sm">
          Inscribite al curso para participar del foro.
        </p>
      )}

      {composing && canParticipate && <ThreadForm onSubmit={publish} onCancel={() => setComposing(false)} />}

      <ThreadList key={version} load={loadThreads} emptyMessage="Todavía no hay hilos en este curso. ¡Abrí el primero!" />
    </div>
  );
}
