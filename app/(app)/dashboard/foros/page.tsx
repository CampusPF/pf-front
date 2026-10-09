import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MessagesSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Foros — Campus",
};

/* Portada de Foros: de acá se elige entre los foros de los propios cursos
   (actividad e hilos donde participo) y el foro general de la comunidad. */
export default function ForumsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="text-text text-2xl font-bold md:text-3xl">Foros</h1>
      <p className="text-text-muted mt-1 text-sm">Elegí dónde querés participar.</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href="/dashboard/foros/mis-cursos"
            className="bg-surface border-border hover:border-primary/40 flex h-full gap-4 rounded-xl border p-4 transition-colors"
          >
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <BookOpen className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="text-text block font-semibold">Foros de mis cursos</span>
              <span className="text-text-muted mt-0.5 block text-sm">
                Hilos de tus cursos y tus propias participaciones.
              </span>
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/foros/general"
            className="bg-surface border-border hover:border-primary/40 flex h-full gap-4 rounded-xl border p-4 transition-colors"
          >
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <MessagesSquare className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="text-text block font-semibold">Foros generales</span>
              <span className="text-text-muted mt-0.5 block text-sm">
                Charlas de toda la comunidad del campus
              </span>
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
