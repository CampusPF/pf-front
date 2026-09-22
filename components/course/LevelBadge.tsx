import type { CourseLevel } from "@/types/course.types";

/* Insignia de nivel, con color por dificultad (semáforo: verde → ámbar →
   rojo) para que se pueda distinguir de un vistazo al escanear una grilla
   filtrada por nivel, sin tener que leer el texto de cada card.

   Vive aparte de CourseCard porque el detalle del curso ya muestra el nivel
   en su propio badge (con estilo distinto, sobre el hero) — este es
   específico de la superficie chica de las cards. */

const LEVEL_STYLE: Record<CourseLevel, { dot: string; bg: string; text: string }> = {
  beginner: { dot: "bg-success", bg: "bg-success-subtle", text: "text-success" },
  intermediate: { dot: "bg-warning", bg: "bg-warning-subtle", text: "text-warning" },
  advanced: { dot: "bg-danger", bg: "bg-danger-subtle", text: "text-danger" },
};

export default function LevelBadge({
  level,
  label,
}: {
  level: CourseLevel;
  label: string;
}) {
  const style = LEVEL_STYLE[level];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
      {label}
    </span>
  );
}
