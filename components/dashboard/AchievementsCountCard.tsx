"use client";

import { Trophy } from "lucide-react";

import { StatTile, StatTileSkeleton } from "@/components/dashboard/StatTile";
import { useDashboardSummary } from "@/services/gamification/use-dashboard-summary";

/* Reemplaza el tile de "logros" mockeado de StatsRow por el conteo real de
   GET /me/dashboard. Mismo patrón que StreakCard/StudiedTimeCard: fetch
   propio, degrada sola si falla.

   A diferencia de esas dos, acá el error cae en el mock (0) en vez de un
   mensaje: es un tile de una sola cifra en la fila de stats, no hay lugar
   para explicar un error sin romper el grid. */
export default function AchievementsCountCard() {
  const summary = useDashboardSummary();

  if (summary.status === "loading") {
    return <StatTileSkeleton label="Cargando tus logros" />;
  }

  const count = summary.status === "success" ? summary.value.logros.length : 0;

  return (
    <StatTile icon={Trophy} iconClass="text-warning" tintClass="bg-warning-subtle">
      <p className="text-text text-xl font-bold">{count}</p>
      <p className="text-text-muted truncate text-sm">
        {count === 1 ? "logro" : "logros"}
      </p>
    </StatTile>
  );
}
