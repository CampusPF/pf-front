import type { Metadata } from "next";

import LessonPlayer from "@/components/lesson-player/LessonPlayer";
import { getCourseBySlug } from "@/services/courses/courses.service";

/* Shell del reproductor. Todo lo demás (temario, lección, progreso) pide
   sesión y el token vive en localStorage, así que se carga en el cliente
   (LessonPlayer). Del server sólo sale el título para la pestaña. */
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/courses/[slug]/learn/[lessonId]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const course = await getCourseBySlug(slug).catch(() => null);

  return { title: course ? `${course.title} — Campus` : "Lección — Campus" };
}

export default async function LessonPlayerPage(
  props: PageProps<"/courses/[slug]/learn/[lessonId]">,
) {
  const { slug, lessonId } = await props.params;
  return <LessonPlayer slug={slug} lessonId={lessonId} />;
}
