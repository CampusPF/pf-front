import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FolderCode, Star, Users } from "lucide-react";

import { MOCK_COURSES } from "@/data/courses.mock";
import { formatStudents } from "@/lib/course-utils";
import CourseTabs from "@/components/course/CourseTabs";
import EnrollCTA from "@/components/course/EnrollCTA";

export function generateStaticParams() {
  return MOCK_COURSES.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata(
  props: PageProps<"/courses/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const course = MOCK_COURSES.find((item) => item.slug === slug);

  if (!course) return { title: "Curso no encontrado — Campus" };

  return {
    title: `${course.title} — Campus`,
    description: course.description,
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  const course = MOCK_COURSES.find((item) => item.slug === slug);

  if (!course) notFound();

  return (
    <main className="bg-bg flex-1">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section
        className={`bg-gradient-to-br ${course.coverGradient} relative pt-16`}
      >
        {/* Overlay: los gradientes claros dejan el texto blanco al límite. */}
        <div className="absolute inset-0 bg-black/20" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[1fr_20rem]">
          <div className="text-white">
            <Link
              href="/courses"
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80 transition-colors duration-150 hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Volver a cursos
            </Link>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                {course.categoryLabel}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                {course.levelLabel}
              </span>
              {course.isPremium && (
                <span className="bg-accent-solid rounded-full px-3 py-1 text-xs font-medium">
                  Premium
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-bold md:text-5xl">
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-white/90">
              {course.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-white/90">
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-current" aria-hidden />
                <span className="font-semibold">{course.rating}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4" aria-hidden />
                {formatStudents(course.studentsCount)} alumnos
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden />
                {course.durationHours} horas
              </span>
              <span className="flex items-center gap-1.5">
                <FolderCode className="size-4" aria-hidden />
                {course.projectsCount} proyectos
              </span>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold backdrop-blur-sm">
                {initials(course.instructor.name)}
              </span>
              <div>
                <p className="font-medium">{course.instructor.name}</p>
                <p className="text-sm text-white/80">
                  {course.instructor.title}
                </p>
              </div>
            </div>
          </div>

          <EnrollCTA course={course} />
        </div>
      </section>

      {/* ── Contenido ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <CourseTabs course={course} />
      </section>
    </main>
  );
}
