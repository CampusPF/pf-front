"use client";

import Link from "next/link";
import { ChevronRight, Lock, type LucideIcon } from "lucide-react";

import ProgressBar from "@/components/course/ProgressBar";
import { achievementIcon } from "@/lib/achievement-icons";
import { useDashboardSummary } from "@/services/gamification/use-dashboard-summary";
import type {
  LockedAchievement,
  UnlockedAchievement,
} from "@/services/gamification/gamification.service";

/* Nivel/XP y logros. Bloque nuevo, sin pulir tanto como el resto del
   dashboard a propósito (el certificado es lo vistoso para la demo) — pero
   anda, con sus propios loading/error/vacío igual que el resto de las
   tarjetas del dashboard.

   Es un adelanto: hasta PREVIEW_LIMIT logros (los desbloqueados más
   recientes primero). El detalle, con cuánto falta para cada uno, está en
   /dashboard/logros. */
const PREVIEW_LIMIT = 8;
const iconFor = achievementIcon;

export default function LevelAndAchievements() {
  const summary = useDashboardSummary();

  if (summary.status === "loading") {
    return (
      <section aria-busy="true" aria-label="Cargando tu nivel y tus logros">
        <div className="bg-surface-elevated h-40 animate-pulse rounded-xl" aria-hidden />
      </section>
    );
  }

  // Se oculta la sección entera antes que mostrar un nivel/logros a medias o
  // inventados: no es un dato crítico para usar el dashboard.
  if (summary.status === "error") return null;

  const { value } = summary;
  const totalAchievements = value.logros.length + value.logrosBloqueados.length;
  const unlockedPreview = value.logros.slice(0, PREVIEW_LIMIT);
  const lockedPreview = value.logrosBloqueados.slice(0, PREVIEW_LIMIT - unlockedPreview.length);

  return (
    <section aria-label="Tu nivel y tus logros" className="flex flex-col gap-4">
      <LevelCard
        nivel={value.nivel}
        xp={value.xp}
        xpDelNivel={value.xpDelNivel}
        xpParaElSiguiente={value.xpParaElSiguiente}
      />

      {totalAchievements > 0 && (
        <div className="bg-surface border-border rounded-xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-text text-sm font-semibold">
              Logros
              <span className="text-text-muted ml-1.5 font-normal">
                ({value.logros.length}/{totalAchievements})
              </span>
            </h2>
            <Link
              href="/dashboard/logros"
              className="text-primary inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
            >
              Ver todos
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {unlockedPreview.map((achievement) => (
              <UnlockedBadge
                key={achievement.code}
                achievement={achievement}
                icon={iconFor(achievement.icono)}
              />
            ))}
            {lockedPreview.map((achievement) => (
              <LockedBadge
                key={achievement.code}
                achievement={achievement}
                icon={iconFor(achievement.icono)}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function LevelCard({
  nivel,
  xp,
  xpDelNivel,
  xpParaElSiguiente,
}: {
  nivel: number;
  xp: number;
  xpDelNivel: number;
  xpParaElSiguiente: number | null;
}) {
  const isMaxLevel = xpParaElSiguiente === null;
  const percent = isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpDelNivel / xpParaElSiguiente) * 100));

  return (
    <div className="bg-surface border-border flex items-center gap-4 rounded-xl border p-5 shadow-sm">
      <span className="bg-accent-subtle text-accent flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold">
        {nivel}
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-text text-sm font-semibold">Nivel {nivel}</p>
          <p className="text-text-muted text-xs tabular-nums">
            {isMaxLevel
              ? `${xp} XP · nivel máximo`
              : `${xpDelNivel}/${xpParaElSiguiente} XP`}
          </p>
        </div>
        <ProgressBar value={percent} label={`Progreso al nivel ${nivel + 1}`} />
      </div>
    </div>
  );
}

function UnlockedBadge({
  achievement,
  icon: Icon,
}: {
  achievement: UnlockedAchievement;
  icon: LucideIcon;
}) {
  return (
    <li
      className="border-border flex flex-col items-center gap-2 rounded-lg border p-3 text-center"
      title={`Desbloqueado el ${new Date(achievement.unlockedAt).toLocaleDateString("es-AR")}`}
    >
      <span className="bg-warning-subtle text-warning flex size-11 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-text text-xs leading-snug font-medium">{achievement.nombre}</p>
    </li>
  );
}

function LockedBadge({
  achievement,
  icon: Icon,
}: {
  achievement: LockedAchievement;
  icon: LucideIcon;
}) {
  return (
    <li
      className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed p-3 text-center opacity-60"
      title={achievement.descripcion}
    >
      <span className="bg-surface-elevated text-text-muted relative flex size-11 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden />
        <Lock className="text-text-muted absolute -right-1 -bottom-1 size-3.5 rounded-full bg-inherit" aria-hidden />
      </span>
      <p className="text-text-muted text-xs leading-snug font-medium">{achievement.nombre}</p>
    </li>
  );
}
