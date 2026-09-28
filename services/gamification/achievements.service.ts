import { apiFetch } from "@/services/api-client";

/* `GET /me/achievements`: todo el catálogo de logros con el progreso del
   usuario de la sesión. El back evalúa antes de responder, así que un logro
   que ya se cumplía aparece desbloqueado (con `nuevo: true`) al abrir la
   pantalla. El resumen de la home sigue en GET /me/dashboard
   (gamification.service.ts). */

export interface Achievement {
  code: string;
  nombre: string;
  /** En imperativo ("Completá 10 lecciones"): es la instrucción de qué hacer. */
  descripcion: string;
  icono: string;
  /** El `type` de la condición en el back (ver ACHIEVEMENT_METRICS en pf-back). */
  tipo: string;
  meta: number;
  /** Topeado en `meta`. */
  actual: number;
  desbloqueado: boolean;
  unlockedAt: string | null;
  /** Se desbloqueó en esta misma consulta: se celebra una sola vez. */
  nuevo: boolean;
}

export function getMyAchievements(signal?: AbortSignal): Promise<Achievement[]> {
  return apiFetch<Achievement[]>("/me/achievements", { auth: true, signal });
}

/* ── Presentación ─────────────────────────────────────────────────────
   Cómo se agrupa y cómo se lee cada tipo. Un `tipo` que el front no conozca
   cae en "Otros" con números sin unidad: nunca rompe. */

interface CategoryInfo {
  label: string;
  /** Singular / plural de la unidad ("lección" / "lecciones"). */
  unit: [string, string];
  /** Adónde ir para avanzar en este logro. */
  cta: { label: string; href: string } | null;
}

const CATEGORIES: Record<string, CategoryInfo> = {
  courses_enrolled: {
    label: "Primeros pasos",
    unit: ["curso", "cursos"],
    cta: { label: "Explorar cursos", href: "/courses" },
  },
  lessons_completed: {
    label: "Lecciones",
    unit: ["lección", "lecciones"],
    cta: { label: "Seguir aprendiendo", href: "/dashboard/mis-cursos" },
  },
  streak_days: {
    label: "Constancia",
    unit: ["día seguido", "días seguidos"],
    cta: { label: "Estudiar hoy", href: "/dashboard/mis-cursos" },
  },
  studied_minutes: {
    label: "Tiempo de estudio",
    unit: ["min", "min"],
    cta: { label: "Seguir aprendiendo", href: "/dashboard/mis-cursos" },
  },
  quizzes_passed: {
    label: "Checkpoints",
    unit: ["checkpoint", "checkpoints"],
    cta: { label: "Ir a mis cursos", href: "/dashboard/mis-cursos" },
  },
  courses_completed: {
    label: "Cursos terminados",
    unit: ["curso", "cursos"],
    cta: { label: "Ir a mis cursos", href: "/dashboard/mis-cursos" },
  },
  certificates_issued: {
    label: "Certificados",
    unit: ["certificado", "certificados"],
    cta: { label: "Ir a mis cursos", href: "/dashboard/mis-cursos" },
  },
  level_reached: {
    label: "Nivel",
    unit: ["nivel", "niveles"],
    cta: { label: "Ganar XP", href: "/dashboard/mis-cursos" },
  },
};

/** Orden de las secciones: de lo que se consigue primero a lo más difícil. */
export const CATEGORY_ORDER = Object.keys(CATEGORIES);

const FALLBACK: CategoryInfo = { label: "Otros", unit: ["", ""], cta: null };

export function categoryOf(tipo: string): CategoryInfo {
  return CATEGORIES[tipo] ?? FALLBACK;
}

function plural(count: number, [one, many]: [string, string]): string {
  return `${count} ${count === 1 ? one : many}`.trim();
}

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toLocaleString("es-AR", { maximumFractionDigits: 1 })} h`;
}

/** "7/10 lecciones", "35/60 min", "4,5/10 h", "Nivel 3 de 5". */
export function formatProgress(a: Achievement): string {
  if (a.tipo === "level_reached") return `Nivel ${a.actual} de ${a.meta}`;
  if (a.tipo === "studied_minutes" && a.meta >= 120) {
    return `${formatHours(a.actual)} de ${formatHours(a.meta)}`;
  }
  const [, many] = categoryOf(a.tipo).unit;
  return `${a.actual}/${a.meta} ${many}`.trim();
}

/** "Te faltan 3 lecciones" / "Te falta 1 día seguido". */
export function formatRemaining(a: Achievement): string {
  const left = Math.max(0, a.meta - a.actual);
  if (a.tipo === "studied_minutes" && left >= 120) return `Te faltan ${formatHours(left)}`;
  return `${left === 1 ? "Te falta" : "Te faltan"} ${plural(left, categoryOf(a.tipo).unit)}`;
}

/** 0 a 100. */
export function progressPercent(a: Achievement): number {
  if (a.desbloqueado || a.meta <= 0) return 100;
  return Math.round((a.actual / a.meta) * 100);
}

/**
 * El bloqueado más cerca de conseguirse: el que tiene más porcentaje hecho
 * y, a igualdad, el que pide menos. Es la sugerencia de "qué hago ahora".
 */
export function nextAchievement(list: Achievement[]): Achievement | null {
  const locked = list.filter((a) => !a.desbloqueado);
  if (locked.length === 0) return null;
  return [...locked].sort(
    (a, b) => progressPercent(b) - progressPercent(a) || a.meta - a.actual - (b.meta - b.actual),
  )[0];
}
