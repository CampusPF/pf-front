import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MOCK_COURSES } from "@/data/courses.mock";
import { LESSON_CONTENT } from "@/data/lesson-content.mock";
import {
  MOCK_COMPLETED_LESSON_IDS,
  MOCK_PROGRESS_PERCENT,
} from "@/data/progress.mock";
import {
  findLesson,
  findModuleOfLesson,
  getAdjacentLessons,
  getAllLessons,
  getLessonPosition,
} from "@/lib/course-utils";
import LessonTutorContext from "@/components/ai-tutor/LessonTutorContext";
import LessonContent from "@/components/lesson-player/LessonContent";
import LessonHeader from "@/components/lesson-player/LessonHeader";
import LessonNavigation from "@/components/lesson-player/LessonNavigation";
import LessonSidebar from "@/components/lesson-player/LessonSidebar";

export function generateStaticParams() {
  return MOCK_COURSES.flatMap((course) =>
    getAllLessons(course).map((lesson) => ({
      slug: course.slug,
      lessonId: lesson.id,
    })),
  );
}

export async function generateMetadata(
  props: PageProps<"/courses/[slug]/learn/[lessonId]">,
): Promise<Metadata> {
  const { slug, lessonId } = await props.params;
  const course = MOCK_COURSES.find((item) => item.slug === slug);
  const lesson = course ? findLesson(course, lessonId) : null;

  if (!course || !lesson) return { title: "Lección no encontrada — Campus" };

  return { title: `${lesson.title} — ${course.title}` };
}

export default async function LessonPlayerPage(
  props: PageProps<"/courses/[slug]/learn/[lessonId]">,
) {
  const { slug, lessonId } = await props.params;

  const course = MOCK_COURSES.find((item) => item.slug === slug);
  if (!course) notFound();

  const lesson = findLesson(course, lessonId);
  const courseModule = findModuleOfLesson(course, lessonId);
  if (!lesson || !courseModule) notFound();

  const { previous, next } = getAdjacentLessons(course, lessonId);
  const { index, total } = getLessonPosition(course, lessonId);

  return (
    <>
      <LessonTutorContext lessonTitle={lesson.title} />

      <LessonHeader
        courseSlug={course.slug}
        courseTitle={course.title}
        lessonIndex={index}
        lessonTotal={total}
        progressPercent={MOCK_PROGRESS_PERCENT}
      />

      <div className="flex flex-1 pt-16">
        <LessonSidebar
          course={course}
          currentLessonId={lesson.id}
          completedLessonIds={MOCK_COMPLETED_LESSON_IDS}
        />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <LessonContent
              lesson={lesson}
              moduleOrder={courseModule.order}
              moduleTitle={courseModule.title}
              content={LESSON_CONTENT[lesson.id]}
            />

            <LessonNavigation
              courseSlug={course.slug}
              previous={previous}
              next={next}
            />
          </div>
        </main>
      </div>
    </>
  );
}
