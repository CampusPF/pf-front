"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import CourseForm from "@/components/admin/CourseForm";
import SyllabusEditor from "@/components/admin/SyllabusEditor";
import { ErrorBanner, Loading } from "@/components/admin/admin-ui";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import { getAdminCourse } from "@/services/admin/admin.service";
import type { RawCourse } from "@/services/courses/courses.raw";

/* Edición de un curso: datos + portada (CourseForm) y temario (SyllabusEditor). */
export default function CourseEditor({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<RawCourse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCourse(await getAdminCourse(courseId));
    } catch (caught) {
      setError(adminErrorMessage(caught, "No pudimos cargar el curso."));
    }
  }, [courseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/admin/cursos"
          className="text-text-secondary hover:text-text inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a cursos
        </Link>
        {course?.isActive && (
          <Link
            href={`/courses/${course.slug}`}
            target="_blank"
            className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            Ver en el catálogo
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {error && <ErrorBanner message={error} />}
      {!course && !error && <Loading label="Cargando curso…" />}

      {course && (
        <>
          <CourseForm course={course} onSaved={setCourse} />
          <SyllabusEditor courseId={course.id} modules={course.modules ?? []} onChanged={load} />
        </>
      )}
    </div>
  );
}
