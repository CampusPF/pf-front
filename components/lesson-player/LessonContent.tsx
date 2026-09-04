import { FileText } from "lucide-react";

import type { Lesson, LessonContent as Content } from "@/types/course.types";
import { formatDuration } from "@/lib/course-utils";
import MarkdownRenderer from "@/components/lesson-player/MarkdownRenderer";

export default function LessonContent({
  lesson,
  moduleOrder,
  moduleTitle,
  content,
}: {
  lesson: Lesson;
  moduleOrder: number;
  moduleTitle: string;
  content?: Content;
}) {
  const hasVideo = Boolean(content?.videoId);
  const hasMarkdown = Boolean(content?.markdown);

  return (
    <article>
      <h1 className="text-text mb-2 text-3xl font-bold">{lesson.title}</h1>
      <p className="text-text-muted text-sm">
        {formatDuration(lesson.durationMinutes)} · Módulo {moduleOrder}:{" "}
        {moduleTitle}
      </p>

      {content?.videoId && (
        <div className="my-6 aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${content.videoId}?rel=0`}
            title={lesson.title}
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      )}

      {content?.markdown && <MarkdownRenderer markdown={content.markdown} />}

      {!hasVideo && !hasMarkdown && (
        <div className="border-border bg-surface my-8 rounded-2xl border border-dashed p-10 text-center">
          <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
            <FileText className="size-6" aria-hidden />
          </span>
          <h2 className="text-text mt-4 font-semibold">
            Contenido en preparación
          </h2>
          <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm">
            Estamos trabajando en esta lección. Mientras tanto, podés
            preguntarle al tutor IA cualquier duda sobre el tema.
          </p>
        </div>
      )}
    </article>
  );
}
