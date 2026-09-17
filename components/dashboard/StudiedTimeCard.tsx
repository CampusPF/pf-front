"use client";

import { Clock } from "lucide-react";

import { StatTile, StatTileMessage, StatTileSkeleton } from "@/components/dashboard/StatTile";
import { formatDuration } from "@/lib/course-utils";
import { useStudiedTime } from "@/services/progress/use-progress-stats";

export default function StudiedTimeCard() {
  const studied = useStudiedTime();

  if (studied.status === "loading") {
    return <StatTileSkeleton label="Cargando tus horas de estudio" />;
  }

  if (studied.status === "error") {
    return (
      <StatTile icon={Clock} iconClass="text-text-muted" tintClass="bg-surface-elevated">
        <StatTileMessage>No pudimos cargar tus horas de estudio</StatTileMessage>
      </StatTile>
    );
  }

  if (studied.value === 0) {
    return (
      <StatTile icon={Clock} iconClass="text-text-muted" tintClass="bg-surface-elevated">
        <StatTileMessage>Todavía no registrás horas de estudio, ¡arrancá una lección!</StatTileMessage>
      </StatTile>
    );
  }

  return (
    <StatTile icon={Clock} iconClass="text-success" tintClass="bg-success-subtle">
      {/* Nunca el número crudo: 735 → "12 h 15 min". */}
      <p className="text-text text-xl font-bold">{formatDuration(studied.value)}</p>
      <p className="text-text-muted truncate text-sm">estudiadas</p>
    </StatTile>
  );
}
