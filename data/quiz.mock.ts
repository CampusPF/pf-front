import type { Quiz } from "@/types/quiz.types";

/* Mock del checkpoint. Sólo se usa con NEXT_PUBLIC_QUIZ_SOURCE=mock (ver
   services/quizzes/quizzes.service.ts).

   Tiene la forma exacta de lo que el alumno recibe del back: sin la opción
   correcta. Las correctas viven aparte (MOCK_CORRECT_OPTIONS) porque en el
   back real las conoce sólo el server, que es quien corrige.

   `courseId`/`moduleId` son de relleno: en modo mock el servicio lo engancha al
   módulo número `moduleOrder` (el 2) de cualquier curso. */

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: "quiz-js-m2",
    courseId: "1",
    moduleId: "m2",
    moduleOrder: 2,
    title: "Checkpoint del módulo 2",
    passingScore: 70,
    questions: [
      {
        id: "q1",
        text: "¿Qué imprime `console.log(2 + \"2\")`?",
        options: [
          { id: "q1a", text: "4" },
          { id: "q1b", text: "\"22\"" },
          { id: "q1c", text: "NaN" },
          { id: "q1d", text: "Lanza un error" },
        ],
      },
      {
        id: "q2",
        text: "¿Qué operador compara valor y tipo sin hacer conversión?",
        options: [
          { id: "q2a", text: "==" },
          { id: "q2b", text: "=" },
          { id: "q2c", text: "===" },
          { id: "q2d", text: "!=" },
        ],
      },
      {
        id: "q3",
        text: "¿Cuándo se ejecuta el bloque `finally` de un `try/catch`?",
        options: [
          { id: "q3a", text: "Sólo si hubo un error" },
          { id: "q3b", text: "Sólo si no hubo error" },
          { id: "q3c", text: "Siempre, haya o no error" },
          { id: "q3d", text: "Nunca, es opcional y no hace nada" },
        ],
      },
      {
        id: "q4",
        text: "¿Cuál de estos bucles recorre los valores de un array directamente?",
        options: [
          { id: "q4a", text: "for...in" },
          { id: "q4b", text: "for...of" },
          { id: "q4c", text: "while" },
          { id: "q4d", text: "do...while" },
        ],
      },
      {
        id: "q5",
        text: "En un `switch`, ¿qué pasa si te olvidás el `break` de un `case`?",
        options: [
          { id: "q5a", text: "Da un error de sintaxis" },
          { id: "q5b", text: "Se ejecuta el `case` siguiente también" },
          { id: "q5c", text: "El `switch` termina igual" },
          { id: "q5d", text: "Se ignora ese `case`" },
        ],
      },
    ],
  },
];

/** questionId → optionId correcto. Sólo lo usa el corrector mock. */
export const MOCK_CORRECT_OPTIONS: Record<string, string> = {
  q1: "q1b",
  q2: "q2c",
  q3: "q3c",
  q4: "q4b",
  q5: "q5b",
};
