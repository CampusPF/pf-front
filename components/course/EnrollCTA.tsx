import Link from "next/link";
import { Check } from "lucide-react";

import type { Course } from "@/types/course.types";
import { formatPrice } from "@/types/checkout";
import {
  getFirstLesson,
  getLessonsCount,
  getResumeLesson,
  lessonHref,
} from "@/lib/course-utils";
import { MOCK_COMPLETED_LESSON_IDS } from "@/data/progress.mock";

export default function EnrollCTA({ course }: { course: Course }) {
  const firstLesson = getFirstLesson(course);
  const resumeLesson = getResumeLesson(course, MOCK_COMPLETED_LESSON_IDS);
  // Sólo ofrecemos "continuar" si ya arrancó el curso (o sea, si hay algo hecho).
  const hasProgress =
    resumeLesson !== null && resumeLesson.id !== firstLesson?.id;

  const perks = [
    `${getLessonsCount(course)} lecciones interactivas`,
    "Tutor IA 24/7",
    "Certificado al finalizar",
    "Acceso de por vida",
  ];

  return (
    <aside className="bg-surface border-border rounded-2xl border p-6 shadow-lg lg:sticky lg:top-24 lg:self-start">
      <p className="text-text flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          {course.isPremium ? formatPrice(course.priceInCents, course.currency) : "Gratis"}
        </span>
      </p>
      <p className="text-text-muted mt-1 text-sm">
        {course.isPremium
          ? "Pago único, acceso de por vida a este curso."
          : "Sin tarjeta de crédito. Empezás ahora."}
      </p>

      <div className="mt-5 space-y-2">
        {course.isPremium ? (
          <>
            <Link
              href={`/checkout?courseId=${course.slug}`}
              className="bg-primary-solid hover:bg-primary-solid-hover block cursor-pointer rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition-colors duration-150"
            >
              Comprar este curso
            </Link>
            <Link
              href="/checkout?plan=premium"
              className="border-border text-text-secondary hover:bg-surface-elevated hover:text-text block cursor-pointer rounded-lg border px-4 py-2.5 text-center text-sm font-medium transition-colors duration-150"
            >
              O suscribirme a Premium ($19/mes, todos los cursos)
            </Link>
          </>
        ) : (
          firstLesson && (
            <Link
              href={lessonHref(course.slug, firstLesson.id)}
              className="bg-primary-solid hover:bg-primary-solid-hover block cursor-pointer rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition-colors duration-150"
            >
              Empezar curso
            </Link>
          )
        )}

        {hasProgress && (
          <Link
            href={lessonHref(course.slug, resumeLesson.id)}
            className="border-border text-text-secondary hover:bg-surface-elevated hover:text-text block cursor-pointer rounded-lg border px-4 py-2.5 text-center text-sm font-medium transition-colors duration-150"
          >
            Continuar donde dejaste
          </Link>
        )}
      </div>

      <div className="border-border mt-6 border-t pt-5">
        <p className="text-text-muted mb-3 text-xs font-semibold tracking-wider uppercase">
          Este curso incluye
        </p>
        <ul className="space-y-2.5">
          {perks.map((perk) => (
            <li
              key={perk}
              className="text-text-secondary flex items-start gap-2.5 text-sm"
            >
              <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
