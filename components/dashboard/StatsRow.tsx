"use client";

import { BookOpen } from "lucide-react";

import { DASHBOARD_STATS } from "@/data/dashboard.mock";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { StatTile } from "@/components/dashboard/StatTile";
import AchievementsCountCard from "@/components/dashboard/AchievementsCountCard";
import StreakCard from "@/components/dashboard/StreakCard";
import StudiedTimeCard from "@/components/dashboard/StudiedTimeCard";

export default function StatsRow() {
  const { data, isLoading } = useDashboardData();

  /* Racha, horas y logros se cargan solas (cada tarjeta con su skeleton y su
     error propios): no dependen de este provider. "Cursos activos" es lo
     único real que sale de acá (ver dashboard.view.ts). */
  const stats = data?.stats ?? DASHBOARD_STATS;
  const activeCourses = stats.find((stat) => stat.key === "activeCourses");

  return (
    <section aria-label="Tus estadísticas" aria-busy={isLoading}>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StreakCard />
        <StatTile icon={BookOpen} iconClass="text-primary" tintClass="bg-primary-subtle">
          <p className="text-text text-xl font-bold">{activeCourses?.value}</p>
          <p className="text-text-muted truncate text-sm">{activeCourses?.label}</p>
        </StatTile>
        <AchievementsCountCard />
        <StudiedTimeCard />
      </ul>
    </section>
  );
}
