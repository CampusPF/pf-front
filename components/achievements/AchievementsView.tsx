"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Check, Lock, PartyPopper, Trophy } from "lucide-react";

import ProgressBar from "@/components/course/ProgressBar";
import { renderAchievementIcon } from "@/lib/achievement-icons";
import {
  CATEGORY_ORDER,
  categoryOf,
  formatProgress,
  formatRemaining,
  getMyAchievements,
  nextAchievement,
  progressPercent,
  type Achievement,
} from "@/services/gamification/achievements.service";

type Filter = "all" | "unlocked" | "locked";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; list: Achievement[] };

/* Pantalla de logros: qué conseguiste y qué te falta para el resto.

   Jerarquía pensada para motivar, no sólo para inventariar:
   1. Resumen (x de y) + los recién desbloqueados, celebrados una sola vez.
   2. "Tu próximo logro": el más cerca de conseguirse, con el número exacto
      que falta y un botón que lleva adonde se avanza.
   3. El catálogo por categoría, con filtro. Cada bloqueado dice qué hacer
      ("Completá 25 lecciones") y cuánto llevás, nunca sólo un candado. */
export default function AchievementsView() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback((signal?: AbortSignal) => {
    setState({ status: "loading" });
    getMyAchievements(signal)
      .then((list) => {
        if (!signal?.aborted) setState({ status: "success", list });
      })
      .catch(() => {
        if (!signal?.aborted) setState({ status: "error" });
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- primera carga al montar, mismo criterio que el resto del dashboard.
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-text text-2xl font-bold">Logros</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Cada paso que das en Campus suma. Mirá lo que ya conseguiste y lo que te falta para el resto.
        </p>
      </header>

      {state.status === "loading" && <AchievementsSkeleton />}

      {state.status === "error" && (
        <div
          role="alert"
          className="bg-danger-subtle text-danger border-danger/30 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">No pudimos cargar tus logros.</span>
          <button
            type="button"
            onClick={() => load()}
            className="cursor-pointer font-medium underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {state.status === "success" && (
        <AchievementsContent list={state.list} filter={filter} onFilterChange={setFilter} />
      )}
    </div>
  );
}

function AchievementsContent({
  list,
  filter,
  onFilterChange,
}: {
  list: Achievement[];
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}) {
  const unlocked = list.filter((a) => a.desbloqueado);
  const fresh = list.filter((a) => a.nuevo);
  const next = nextAchievement(list);
  const percent = list.length > 0 ? Math.round((unlocked.length / list.length) * 100) : 0;

  const visible = list.filter((a) =>
    filter === "all" ? true : filter === "unlocked" ? a.desbloqueado : !a.desbloqueado,
  );

  const groups = useMemo(() => {
    const byType = new Map<string, Achievement[]>();
    for (const a of visible) byType.set(a.tipo, [...(byType.get(a.tipo) ?? []), a]);
    const known = CATEGORY_ORDER.filter((tipo) => byType.has(tipo));
    const unknown = [...byType.keys()].filter((tipo) => !CATEGORY_ORDER.includes(tipo));
    return [...known, ...unknown].map((tipo) => ({ tipo, items: byType.get(tipo)! }));
  }, [visible]);

  if (list.length === 0) {
    return (
      <div className="border-border flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
        <Trophy className="text-text-muted size-10" aria-hidden />
        <p className="text-text text-sm font-medium">Todavía no hay logros para mostrar</p>
        <p className="text-text-muted text-sm">Volvé en un rato: estamos preparando el catálogo.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Resumen ─────────────────────────────────────────────── */}
      <section
        aria-label="Resumen de logros"
        className="bg-surface border-border flex flex-col gap-4 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center"
      >
        <span className="bg-warning-subtle text-warning flex size-14 shrink-0 items-center justify-center rounded-full">
          <Trophy className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-text text-lg font-semibold">
            {unlocked.length} de {list.length} logros desbloqueados
          </p>
          <ProgressBar value={percent} label="Logros desbloqueados" className="mt-2 h-2" />
          <p className="text-text-muted mt-1.5 text-xs">
            {unlocked.length === list.length
              ? "¡Los conseguiste todos! Sos una leyenda de Campus."
              : unlocked.length === 0
                ? "Completá tu primera lección y desbloqueá el primero."
                : `Llevás el ${percent}% del camino.`}
          </p>
        </div>
      </section>

      {/* ── Recién desbloqueados ────────────────────────────────── */}
      {fresh.length > 0 && (
        <section
          aria-live="polite"
          className="achievement-celebrate bg-accent-subtle border-accent/30 flex items-start gap-3 rounded-xl border p-4"
        >
          <PartyPopper className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-text text-sm font-semibold">
              {fresh.length === 1
                ? `¡Desbloqueaste "${fresh[0].nombre}"!`
                : `¡Desbloqueaste ${fresh.length} logros nuevos!`}
            </p>
            <p className="text-text-secondary text-sm">
              {fresh.length === 1
                ? fresh[0].descripcion
                : fresh.map((a) => a.nombre).join(", ")}
            </p>
          </div>
        </section>
      )}

      {/* ── Próximo logro ───────────────────────────────────────── */}
      {next && <NextAchievementCard achievement={next} />}

      {/* ── Catálogo ────────────────────────────────────────────── */}
      <section aria-labelledby="catalogo-logros" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="catalogo-logros" className="text-text text-base font-semibold">
            Todos los logros
          </h2>
          <div role="group" aria-label="Filtrar logros" className="bg-surface-elevated border-border flex rounded-lg border p-0.5">
            <FilterButton active={filter === "all"} onClick={() => onFilterChange("all")}>
              Todos <span className="text-text-muted">{list.length}</span>
            </FilterButton>
            <FilterButton active={filter === "unlocked"} onClick={() => onFilterChange("unlocked")}>
              Conseguidos <span className="text-text-muted">{unlocked.length}</span>
            </FilterButton>
            <FilterButton active={filter === "locked"} onClick={() => onFilterChange("locked")}>
              Por conseguir <span className="text-text-muted">{list.length - unlocked.length}</span>
            </FilterButton>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="text-text-muted py-6 text-center text-sm">
            {filter === "unlocked"
              ? "Todavía no conseguiste ninguno. ¡El primero está a una lección de distancia!"
              : "No te queda ninguno por conseguir."}
          </p>
        ) : (
          groups.map(({ tipo, items }) => (
            <div key={tipo}>
              <h3 className="text-text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
                {categoryOf(tipo).label}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <AchievementCard key={a.code} achievement={a} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
        active ? "bg-surface text-text shadow-sm" : "text-text-secondary hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function NextAchievementCard({ achievement }: { achievement: Achievement }) {
  const { cta } = categoryOf(achievement.tipo);
  const percent = progressPercent(achievement);

  return (
    <section
      aria-labelledby="proximo-logro"
      className="border-primary/30 bg-primary-subtle flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center"
    >
      <span className="bg-surface text-primary flex size-14 shrink-0 items-center justify-center rounded-full shadow-sm">
        {renderAchievementIcon(achievement.icono, "size-7")}
      </span>
      <div className="min-w-0 flex-1">
        <p id="proximo-logro" className="text-primary text-xs font-semibold tracking-wide uppercase">
          Tu próximo logro
        </p>
        <p className="text-text mt-0.5 text-base font-semibold">{achievement.nombre}</p>
        <p className="text-text-secondary text-sm">{achievement.descripcion}</p>
        <ProgressBar value={percent} label={`Progreso de ${achievement.nombre}`} className="mt-3 h-2" />
        <p className="text-text-secondary mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs">
          <span>{formatProgress(achievement)}</span>
          <span className="text-text font-medium">{formatRemaining(achievement)}</span>
        </p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="bg-primary-solid hover:bg-primary-solid-hover inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150"
        >
          {cta.label}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </section>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const percent = progressPercent(a);

  if (a.desbloqueado) {
    return (
      <li
        className={`bg-surface border-border relative flex gap-3 rounded-xl border p-4 shadow-sm ${
          a.nuevo ? "achievement-celebrate ring-accent/40 ring-2" : ""
        }`}
      >
        <span className="bg-warning-subtle text-warning relative flex size-11 shrink-0 items-center justify-center rounded-full">
          {renderAchievementIcon(a.icono, "size-5")}
          <span className="bg-success border-surface absolute -right-0.5 -bottom-0.5 flex size-4.5 items-center justify-center rounded-full border-2 text-white">
            <Check className="size-2.5" strokeWidth={3} aria-hidden />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-text flex items-center gap-2 text-sm font-semibold">
            <span className="truncate">{a.nombre}</span>
            {a.nuevo && (
              <span className="bg-accent-solid shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                Nuevo
              </span>
            )}
          </p>
          <p className="text-text-secondary text-xs">{a.descripcion}</p>
          {a.unlockedAt && (
            <p className="text-text-muted mt-1.5 text-[11px]">
              Conseguido el {new Date(a.unlockedAt).toLocaleDateString("es-AR")}
            </p>
          )}
        </div>
        <span className="sr-only">Desbloqueado.</span>
      </li>
    );
  }

  return (
    <li className="bg-surface border-border flex gap-3 rounded-xl border border-dashed p-4">
      <span className="bg-surface-elevated text-text-muted relative flex size-11 shrink-0 items-center justify-center rounded-full">
        {renderAchievementIcon(a.icono, "size-5 opacity-60")}
        <span className="bg-surface border-border absolute -right-0.5 -bottom-0.5 flex size-4.5 items-center justify-center rounded-full border">
          <Lock className="size-2.5" aria-hidden />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-text truncate text-sm font-semibold">{a.nombre}</p>
        <p className="text-text-secondary text-xs">{a.descripcion}</p>
        <ProgressBar value={percent} label={`Progreso de ${a.nombre}`} className="mt-2.5" />
        <p className="text-text-muted mt-1 flex justify-between gap-2 text-[11px]">
          <span>{formatProgress(a)}</span>
          {percent > 0 && <span>{formatRemaining(a)}</span>}
        </p>
      </div>
      <span className="sr-only">Bloqueado.</span>
    </li>
  );
}

function AchievementsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando tus logros" className="flex flex-col gap-4">
      <div className="bg-surface-elevated h-28 animate-pulse rounded-xl" aria-hidden />
      <div className="bg-surface-elevated h-36 animate-pulse rounded-xl" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-surface-elevated h-28 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}
