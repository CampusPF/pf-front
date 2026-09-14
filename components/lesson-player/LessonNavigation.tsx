import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, ShoppingCart } from "lucide-react";

import type { Lesson } from "@/types/course.types";
import { lessonHref } from "@/lib/course-utils";

const SECONDARY =
  "border-border text-text-secondary hover:bg-surface-elevated hover:text-text flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150";

const PRIMARY =
  "bg-primary-solid hover:bg-primary-solid-hover flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150";

export default function LessonNavigation({
  courseSlug,
  previous,
  next,
  onAdvance,
  isAdvancing = false,
  buyHref = null,
}: {
  courseSlug: string;
  previous: Lesson | null;
  next: Lesson | null;
  /** Completa la lección actual y navega (ver LessonPlayer). */
  onAdvance: (href: string) => void;
  isAdvancing?: boolean;
  /**
   * Si la siguiente lección está bloqueada en un curso pago (se está viendo
   * la de muestra), a dónde comprar. En vez de "Siguiente" hacia un candado,
   * el botón ofrece directamente la compra.
   */
  buyHref?: string | null;
}) {
  // Sin siguiente es la última lección del curso (no del módulo).
  const forwardHref = next ? lessonHref(courseSlug, next.id) : `/courses/${courseSlug}`;

  return (
    <div className="border-border mt-12 flex items-center justify-between gap-4 border-t pt-6">
      {previous ? (
        <Link
          href={lessonHref(courseSlug, previous.id)}
          className={`${SECONDARY} cursor-pointer`}
        >
          <ChevronLeft className="size-5" aria-hidden />
          Anterior
        </Link>
      ) : (
        <button type="button" disabled className={`${SECONDARY} cursor-not-allowed opacity-50`}>
          <ChevronLeft className="size-5" aria-hidden />
          Anterior
        </button>
      )}

      {buyHref ? (
        <Link href={buyHref} className={`${PRIMARY} cursor-pointer`}>
          <ShoppingCart className="size-5" aria-hidden />
          Comprar curso
        </Link>
      ) : (
      /* Link real (se puede abrir en otra pestaña), pero el click normal pasa
         por onAdvance para completar la lección antes de salir. */
      <Link
        href={forwardHref}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          if (!isAdvancing) onAdvance(forwardHref);
        }}
        aria-disabled={isAdvancing}
        className={`${PRIMARY} cursor-pointer aria-disabled:cursor-wait aria-disabled:opacity-70`}
      >
        {next ? "Siguiente" : "Finalizar curso"}
        {isAdvancing ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <ChevronRight className="size-5" aria-hidden />
        )}
      </Link>
      )}
    </div>
  );
}
