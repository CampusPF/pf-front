import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, BarChart3, Clock, FolderCode, Star, Users } from "lucide-react";

import { formatStudents } from "@/lib/course-utils";
import { getCourseBySlug } from "@/services/courses/courses.service";
import type { Course } from "@/types/course.types";
import CourseCover from "@/components/course/CourseCover";
import CourseLearningProvider from "@/components/course/CourseLearningProvider";
import CourseTabs from "@/components/course/CourseTabs";
import EnrollCTA from "@/components/course/EnrollCTA";
import UserAvatar from "@/components/ui/UserAvatar";

/* Render por request (ver el comentario en /courses/page.tsx). La parte
   pública (hero, módulos) sale del server; lo que depende de la sesión
   (temario completo, progreso, inscripción) lo completa CourseLearningProvider. */
export const dynamic = "force-dynamic";

type Loaded = { course: Course | null; error: string | null };

async function load(slug: string): Promise<Loaded> {
  try {
    return { course: await getCourseBySlug(slug), error: null };
  } catch (caught) {
    return {
      course: null,
      error: caught instanceof Error ? caught.message : "No pudimos cargar el curso.",
    };
  }
}

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { course } = await load(slug);

  if (!course) return { title: "Curso — Campus" };

  return { title: `${course.title} — Campus`, description: course.description };
}

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  const { course, error } = await load(slug);

  if (error) {
    return (
      <main className="bg-bg flex flex-1 flex-col items-center gap-3 px-6 pt-32 pb-20 text-center">
        <AlertCircle className="text-text-muted size-10" aria-hidden />
        <h1 className="text-text text-xl font-semibold">No pudimos cargar el curso</h1>
        <p className="text-text-secondary max-w-sm text-sm">{error}</p>
        <Link href="/courses" className="text-primary text-sm font-medium hover:underline">
          Volver al catálogo
        </Link>
      </main>
    );
  }

  if (!course) notFound();

  return (
    <CourseLearningProvider initialCourse={course}>
      <main className="bg-bg flex-1">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <CourseCover course={course} className="pt-16">
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

              <h1 className="mt-4 text-4xl font-bold md:text-5xl">{course.title}</h1>
              <p className="mt-3 line-clamp-3 max-w-2xl text-lg text-white/90">
                {course.subtitle ?? course.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-white/90">
                {course.rating !== null && (
                  <span className="flex items-center gap-1.5">
                    <Star className="size-4 fill-current" aria-hidden />
                    <span className="font-semibold">{course.rating}</span>
                  </span>
                )}
                {course.studentsCount !== null && (
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden />
                    {formatStudents(course.studentsCount)} alumnos
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="size-4" aria-hidden />
                  {course.modules.length} módulos
                </span>
                {course.durationHours !== null && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden />
                    {course.durationHours} horas
                  </span>
                )}
                {course.projectsCount !== null && (
                  <span className="flex items-center gap-1.5">
                    <FolderCode className="size-4" aria-hidden />
                    {course.projectsCount} proyectos
                  </span>
                )}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <UserAvatar
                  name={course.instructor.name}
                  avatarUrl={course.instructor.avatarUrl}
                  className="size-11 bg-white/20 text-sm backdrop-blur-sm"
                />
                <div>
                  <p className="font-medium">{course.instructor.name}</p>
                  {course.instructor.title && (
                    <p className="text-sm text-white/80">{course.instructor.title}</p>
                  )}
                </div>
              </div>
            </div>

            <EnrollCTA />
          </div>
        </CourseCover>

        {/* ── Contenido ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-4xl px-6 py-12">
          <CourseTabs />
        </section>
      </main>
    </CourseLearningProvider>
  );
}
