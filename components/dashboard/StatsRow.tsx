"use client";

import { BookOpen, Clock, Flame, Trophy, type LucideIcon } from "lucide-react";

import { DASHBOARD_STATS, type StatKey } from "@/data/dashboard.mock";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";

/* Cada stat mapea a un ícono + color de acento. Se mantiene acá (no en el mock)
   porque los componentes de lucide no son serializables como data. */
const STAT_STYLE: Record<
  StatKey,
  { icon: LucideIcon; iconClass: string; tintClass: string }
> = {
  streak: { icon: Flame, iconClass: "text-accent", tintClass: "bg-accent-subtle" },
  activeCourses: {
    icon: BookOpen,
    iconClass: "text-primary",
    tintClass: "bg-primary-subtle",
  },
  achievements: {
    icon: Trophy,
    iconClass: "text-warning",
    tintClass: "bg-warning-subtle",
  },
  hours: { icon: Clock, iconClass: "text-success", tintClass: "bg-success-subtle" },
};

export default function StatsRow() {
  const { data, isLoading } = useDashboardData();

  /* data.stats ya viene mezclado: "cursos activos" es real (del back), y
     racha / logros / horas siguen siendo los del mock porque no hay endpoint
     todavía (ver services/dashboard/dashboard.view.ts). Mientras carga, o si
     el dashboard falló, mostramos los del mock para no dejar la fila vacía. */
  const stats = data?.stats ?? DASHBOARD_STATS;

  return (
    <section aria-label="Tus estadísticas" aria-busy={isLoading}>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const { icon: Icon, iconClass, tintClass } = STAT_STYLE[stat.key];
          return (
            <li
              key={stat.key}
              className="bg-surface border-border flex items-center gap-3 rounded-xl border p-4 shadow-sm"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${tintClass}`}
                aria-hidden
              >
                <Icon className={`size-5 ${iconClass}`} />
              </span>
              <div className="min-w-0">
                <p className="text-text text-xl font-bold">{stat.value}</p>
                <p className="text-text-muted truncate text-sm">{stat.label}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
