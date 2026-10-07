"use client";

import { Flame, Menu } from "lucide-react";

import NotificationsBell from "@/components/notifications/NotificationsBell";
import { useStreak } from "@/services/progress/use-progress-stats";

/* La campana y todo el estado de notificaciones salieron de acá a
   NotificationsCenterProvider + NotificationsBell: vivían dentro de este
   topbar, así que existían sólo en /dashboard. Ahora el topbar se ocupa de lo
   suyo (menú y racha) y monta la campana compartida. */
export default function DashboardTopbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  /* Píldora de racha: sólo con racha real > 0. Cargando, en cero o con error
     no se muestra — el detalle (vacío / error) lo da StreakCard. */
  const streakState = useStreak();
  const streakDays = streakState.status === "success" ? streakState.value : 0;
  const streak =
    streakDays > 0 ? `${streakDays} ${streakDays === 1 ? "día" : "días"}` : "";

  return (
    <header className="bg-surface/80 border-border sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      {/* Hamburguesa: sólo mobile/tablet */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg p-2 transition-colors duration-150 lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className="ml-auto flex items-center gap-2">
        {streak && (
          <span className="bg-accent-subtle text-accent hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium sm:flex">
            <Flame className="size-4" aria-hidden />
            {streak}
          </span>
        )}

        <NotificationsBell />
      </div>
    </header>
  );
}
