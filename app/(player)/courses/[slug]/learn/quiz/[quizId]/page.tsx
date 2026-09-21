import type { Metadata } from "next";

import QuizView from "@/components/quiz/QuizView";

/* Shell del checkpoint. Cae bajo learn/layout.tsx (RequireAuth, sin
   Navbar/Footer). Todo el flujo corre en el cliente: las respuestas viven en
   el estado del componente hasta el envío. El segmento estático `quiz` gana
   sobre `[lessonId]`, así que no pisa las URLs de las lecciones. */
export const metadata: Metadata = { title: "Checkpoint — Campus" };

export default async function QuizPage(
  props: PageProps<"/courses/[slug]/learn/quiz/[quizId]">,
) {
  const { slug, quizId } = await props.params;
  return <QuizView slug={slug} quizId={quizId} />;
}
