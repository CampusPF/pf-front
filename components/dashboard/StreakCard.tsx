"use client";

import { Flame } from "lucide-react";

import { StatTile, StatTileMessage, StatTileSkeleton } from "@/components/dashboard/StatTile";
import { useStreak } from "@/services/progress/use-progress-stats";

export default function StreakCard() {
  const streak = useStreak();

  if (streak.status === "loading") {
    return <StatTileSkeleton label="Cargando tu racha" />;
  }

  if (streak.status === "error") {
    return (
      <StatTile icon={Flame} iconClass="text-text-muted" tintClass="bg-surface-elevated">
        <StatTileMessage>No pudimos cargar tu racha</StatTileMessage>
      </StatTile>
    );
  }

  const days = streak.value;

  // Sin racha: ícono apagado y una invitación, no un "0" pelado.
  if (days === 0) {
    return (
      <StatTile icon={Flame} iconClass="text-text-muted" tintClass="bg-surface-elevated">
        <StatTileMessage>Completá una lección hoy para arrancar tu racha</StatTileMessage>
      </StatTile>
    );
  }

  return (
    <StatTile icon={Flame} iconClass="text-accent" tintClass="bg-accent-subtle">
      <p className="text-text text-xl font-bold">{days}</p>
      <p className="text-text-muted truncate text-sm">
        {days === 1 ? "día seguido" : "días seguidos"}
      </p>
    </StatTile>
  );
}
