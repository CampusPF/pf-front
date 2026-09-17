import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* Carcasa común de las tarjetas de la fila de estadísticas. Todas comparten
   alto mínimo para que la fila no salte entre skeleton, dato, vacío y error. */

export const STAT_TILE_CLASS =
  "bg-surface border-border flex min-h-20 items-center gap-3 rounded-xl border p-4 shadow-sm";

export function StatTile({
  icon: Icon,
  iconClass,
  tintClass,
  children,
}: {
  icon: LucideIcon;
  iconClass: string;
  tintClass: string;
  children: ReactNode;
}) {
  return (
    <li className={STAT_TILE_CLASS}>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${tintClass}`}
        aria-hidden
      >
        <Icon className={`size-5 ${iconClass}`} />
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

/** Skeleton con la misma forma que la tarjeta: ícono + dos líneas. */
export function StatTileSkeleton({ label }: { label: string }) {
  return (
    <li className={STAT_TILE_CLASS} aria-busy="true">
      <span className="sr-only">{label}</span>
      <span className="bg-surface-elevated size-11 shrink-0 animate-pulse rounded-lg" aria-hidden />
      <div className="flex flex-1 flex-col gap-2" aria-hidden>
        <span className="bg-surface-elevated h-5 w-16 animate-pulse rounded" />
        <span className="bg-surface-elevated h-4 w-24 animate-pulse rounded" />
      </div>
    </li>
  );
}

/** Texto para los estados vacío y error: chico, para que entre en el tile. */
export function StatTileMessage({ children }: { children: ReactNode }) {
  return <p className="text-text-muted text-sm leading-snug">{children}</p>;
}
