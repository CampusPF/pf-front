"use client";

import { BookOpen, Trophy } from "lucide-react";

import { DASHBOARD_STATS } from "@/data/dashboard.mock";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { StatTile } from "@/components/dashboard/StatTile";
import StreakCard from "@/components/dashboard/StreakCard";
import StudiedTimeCard from "@/components/dashboard/StudiedTimeCard";

export default function StatsRow() {
  const { data, isLoading } = useDashboardData();

  /* Racha y horas se cargan solas (StreakCard / StudiedTimeCard, cada una con
     su skeleton y su error): no dependen de este provider. "Cursos activos" es
     real (del back) y "logros" sigue mockeado (ver dashboard.view.ts). */
  const stats = data?.stats ?? DASHBOARD_STATS;
  const statValue = (key: "activeCourses" | "achievements") =>
    stats.find((stat) => stat.key === key);
  const activeCourses = statValue("activeCourses");
  const achievements = statValue("achievements");

  return (
    <section aria-label="Tus estadísticas" aria-busy={isLoading}>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StreakCard />
        <StatTile icon={BookOpen} iconClass="text-primary" tintClass="bg-primary-subtle">
          <p className="text-text text-xl font-bold">{activeCourses?.value}</p>
          <p className="text-text-muted truncate text-sm">{activeCourses?.label}</p>
        </StatTile>
        <StatTile icon={Trophy} iconClass="text-warning" tintClass="bg-warning-subtle">
          <p className="text-text text-xl font-bold">{achievements?.value}</p>
          <p className="text-text-muted truncate text-sm">{achievements?.label}</p>
        </StatTile>
        <StudiedTimeCard />
      </ul>
    </section>
  );
}
