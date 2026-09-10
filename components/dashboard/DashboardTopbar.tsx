"use client";

import { Bell, Flame, Menu, Search } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { DASHBOARD_STATS } from "@/data/dashboard.mock";

export default function DashboardTopbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { user } = useAuth();
  // TODO(back): la racha sigue mockeada — no hay endpoint de streak.
  const streak = DASHBOARD_STATS.find((s) => s.key === "streak")?.value ?? "";
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

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

      {/* Buscador global */}
      <div className="relative min-w-0 flex-1 md:max-w-md">
        <Search
          className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Buscar lecciones, ejercicios, conceptos..."
          aria-label="Buscar"
          className="bg-bg border-border text-text placeholder:text-text-muted focus:border-primary focus:ring-primary/30 w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-colors duration-150 focus:ring-2 focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Racha */}
        {streak && (
          <span className="bg-accent-subtle text-accent hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium sm:flex">
            <Flame className="size-4" aria-hidden />
            {streak}
          </span>
        )}

        {/* Notificaciones */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="text-text-secondary hover:text-text hover:bg-surface-elevated relative cursor-pointer rounded-lg p-2 transition-colors duration-150"
        >
          <Bell className="size-5" aria-hidden />
          <span className="bg-danger ring-surface absolute top-1.5 right-1.5 size-2 rounded-full ring-2" />
        </button>


      </div>
    </header>
  );
}
