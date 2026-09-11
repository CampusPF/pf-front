"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { ApiError } from "@/services/api-client";
import { formatPrice } from "@/types/checkout";
import {
  getFirstLesson,
  getLessonsCount,
  getResumeLesson,
  lessonHref,
} from "@/lib/course-utils";
import { enrollInFreeCourse } from "@/services/progress/course-progress.service";
import { useCourseLearning } from "@/components/course/CourseLearningProvider";

const PRIMARY =
  "bg-primary-solid hover:bg-primary-solid-hover flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY =
  "border-border text-text-secondary hover:bg-surface-elevated hover:text-text block cursor-pointer rounded-lg border px-4 py-2.5 text-center text-sm font-medium transition-colors duration-150";

/* Estados del CTA:
   - inscripto → "Continuar" (o "Empezar" si no completó nada);
   - curso gratis sin inscripción → "Inscribirme gratis" (POST /course-enrollments);
   - curso pago sin inscripción → comprar suelto o suscribirse;
   - sin sesión → las acciones mandan a /login y vuelven acá.

   TODO(back): un suscriptor Premium puede VER las lecciones pagas (el back le
   da acceso), pero sin inscripción no puede registrar progreso. Falta que el
   back cree la inscripción al entrar con suscripción activa. */
export default function EnrollCTA() {
  const router = useRouter();
  const { course, progress, isLoading, isAuthenticated, refreshProgress } = useCourseLearning();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstLesson = getFirstLesson(course);
  const isEnrolled = Boolean(progress?.enrollmentId);
  const resumeLesson = getResumeLesson(course, progress?.completedLessonIds ?? []);
  const hasProgress = (progress?.completedLessonIds.length ?? 0) > 0;
  const loginHref = `/login?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`;

  const lessonsCount = getLessonsCount(course);
  const perks = [
    lessonsCount > 0 ? `${lessonsCount} lecciones` : `${course.modules.length} módulos`,
    "Tutor IA 24/7",
    "Material descargable",
    "Acceso de por vida",
  ];

  async function handleFreeEnroll() {
    if (!isAuthenticated) return router.push(loginHref);

    setIsEnrolling(true);
    setError(null);
    try {
      await enrollInFreeCourse(course.id);
      await refreshProgress();
      if (firstLesson) router.push(lessonHref(course.slug, firstLesson.id));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        // Ya estaba inscripto (otra pestaña, doble click): no es un error.
        await refreshProgress();
      } else {
        setError(caught instanceof Error ? caught.message : "No pudimos inscribirte.");
      }
    } finally {
      setIsEnrolling(false);
    }
  }

  return (
    <aside className="bg-surface border-border rounded-2xl border p-6 shadow-lg lg:sticky lg:top-24 lg:self-start">
      <p className="text-text flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          {course.isPremium ? formatPrice(course.priceInCents, course.currency) : "Gratis"}
        </span>
      </p>
      <p className="text-text-muted mt-1 text-sm">
        {isEnrolled
          ? `Ya estás inscripto · ${progress?.progressPercent ?? 0}% completado`
          : course.isPremium
            ? "Pago único, acceso de por vida a este curso."
            : "Sin tarjeta de crédito. Empezás ahora."}
      </p>

      <div className="mt-5 space-y-2">
        {isLoading ? (
          <div className="bg-surface-elevated h-10 animate-pulse rounded-lg" aria-hidden />
        ) : isEnrolled ? (
          resumeLesson || firstLesson ? (
            <Link href={lessonHref(course.slug, (resumeLesson ?? firstLesson)!.id)} className={PRIMARY}>
              {hasProgress ? "Continuar donde dejaste" : "Empezar curso"}
            </Link>
          ) : (
            <p className="text-text-muted text-sm">Este curso todavía no tiene lecciones.</p>
          )
        ) : course.isPremium ? (
          <>
            <Link
              href={isAuthenticated ? `/checkout?courseId=${course.slug}` : loginHref}
              className={PRIMARY}
            >
              Comprar este curso
            </Link>
            <Link href="/checkout?plan=premium" className={SECONDARY}>
              O suscribirme a Premium ($19/mes, todos los cursos)
            </Link>
          </>
        ) : (
          <button type="button" onClick={handleFreeEnroll} disabled={isEnrolling} className={PRIMARY}>
            {isEnrolling && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isAuthenticated ? "Inscribirme gratis" : "Iniciá sesión para empezar"}
          </button>
        )}

        {error && (
          <p role="alert" className="text-danger flex items-start gap-1.5 text-xs">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>

      <div className="border-border mt-6 border-t pt-5">
        <p className="text-text-muted mb-3 text-xs font-semibold tracking-wider uppercase">
          Este curso incluye
        </p>
        <ul className="space-y-2.5">
          {perks.map((perk) => (
            <li key={perk} className="text-text-secondary flex items-start gap-2.5 text-sm">
              <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
