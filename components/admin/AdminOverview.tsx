"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, GraduationCap, Loader2, Trophy, UserPlus, Users } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, ErrorBanner, Loading } from "@/components/admin/admin-ui";
import EnrollmentsChart from "@/components/admin/stats/EnrollmentsChart";
import RangeSelector from "@/components/admin/stats/RangeSelector";
import RevenueChart from "@/components/admin/stats/RevenueChart";
import StatTile from "@/components/admin/stats/StatTile";
import TopCoursesChart from "@/components/admin/stats/TopCoursesChart";
import { formatInt, formatMoney, formatPercent, rangeLabel } from "@/components/admin/stats/format";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import { getAdminStats, type AdminStats, type StatsRange } from "@/services/admin/admin-stats.service";

/* Resumen del panel: métricas de la plataforma (admin) o de mis cursos
   (docente). Todo sale de GET /admin/stats, ya agregado en el back; el
   alcance lo decide el back según el rol, acá no se filtra nada.

   Orden de lectura: el período arriba (afecta a todo), los KPI con su
   comparación, la tendencia principal, y después el detalle. */
export default function AdminOverview() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [range, setRange] = useState<StatsRange>(30);
  const [retryCount, setRetryCount] = useState(0);
  // Últimos datos buenos: se siguen mostrando mientras llega otro período.
  const [stats, setStats] = useState<AdminStats | null>(null);
  // Qué pedido terminó (y si falló). "Cargando" = el pedido actual no terminó.
  const [settled, setSettled] = useState<{ key: string; error: string | null } | null>(null);

  const requestKey = `${range}:${retryCount}`;
  const isLoading = settled?.key !== requestKey;
  const error = settled?.key === requestKey ? settled.error : null;

  useEffect(() => {
    const controller = new AbortController();

    getAdminStats(range, controller.signal)
      .then((data) => {
        setStats(data);
        setSettled({ key: requestKey, error: null });
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setSettled({ key: requestKey, error: adminErrorMessage(caught, "No pudimos cargar las métricas.") });
      });

    return () => controller.abort();
  }, [range, requestKey]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  // Primera carga: todavía no hay nada que mostrar.
  if (!stats) {
    if (error) return <LoadError message={error} onRetry={retry} />;
    return <Loading label="Cargando métricas…" />;
  }

  const comparison = `vs. ${stats.range.days === 365 ? "año" : `${stats.range.days} días`} anterior${
    stats.range.days === 365 ? "" : "es"
  }`;
  const money = (cents: number) => formatMoney(cents, stats.currency);
  const byDay = stats.enrollmentsByDay.map((day) => day.count);
  const { totals, period } = stats;
  const completionRate = totals.enrollments > 0 ? totals.completedEnrollments / totals.enrollments : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <RangeSelector value={range} onChange={setRange} disabled={isLoading} />
          {/* Al cambiar de período se siguen mostrando los datos anteriores
              (sin saltos de layout) con este aviso mientras llegan los nuevos. */}
          <span role="status" className="text-text-muted inline-flex items-center gap-1.5 text-xs">
            {isLoading && (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden /> Actualizando…
              </>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            // Sin "Nuevo curso": el admin no crea ni edita cursos, sólo los
            // elimina o restaura desde la pestaña Cursos.
            <>
              <Link href="/dashboard/admin/cursos" className={BUTTON_SECONDARY}>
                Ver cursos
              </Link>
              <Link href="/dashboard/admin/categorias" className={BUTTON_SECONDARY}>
                Gestionar categorías
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard/admin/cursos" className={BUTTON_SECONDARY}>
                Ver mis cursos
              </Link>
              <Link href="/dashboard/admin/cursos/nuevo" className={BUTTON_PRIMARY}>
                Nuevo curso
              </Link>
            </>
          )}
        </div>
      </div>

      {error && <LoadError message={error} onRetry={retry} />}

      <div aria-busy={isLoading} className="flex flex-col gap-6">
        <section aria-label={`Indicadores de los ${rangeLabel(stats.range.days)}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label={isAdmin ? "Usuarios nuevos" : "Alumnos nuevos"}
              icon={UserPlus}
              metric={period.newStudents}
              format={formatInt}
              comparisonLabel={comparison}
              hint={
                isAdmin
                  ? `${formatInt(totals.users ?? 0)} usuarios en total`
                  : `${formatInt(totals.students)} alumnos en total`
              }
            />
            <StatTile
              label="Inscripciones"
              icon={GraduationCap}
              metric={period.enrollments}
              format={formatInt}
              comparisonLabel={comparison}
              sparkline={byDay}
              hint={`${formatInt(totals.enrollments)} vigentes`}
            />
            <StatTile
              label="Cursos terminados"
              icon={Trophy}
              metric={period.completions}
              format={formatInt}
              comparisonLabel={comparison}
              hint={
                completionRate === null
                  ? undefined
                  : `${formatPercent(completionRate)} de las inscripciones vigentes`
              }
            />
            <StatTile
              label={isAdmin ? "Ingresos" : "Ventas"}
              icon={CircleDollarSign}
              metric={period.revenueCents}
              format={money}
              comparisonLabel={comparison}
              hint={`${money(totals.revenueCents)} en total`}
            />
          </div>
        </section>

        <EnrollmentsChart stats={stats} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <RevenueChart stats={stats} className="lg:col-span-3" />
          <TopCoursesChart stats={stats} className="lg:col-span-2" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <TotalsCard stats={stats} className="lg:col-span-2" />
          <RecentEnrollments stats={stats} className="lg:col-span-3" />
        </div>
      </div>
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <ErrorBanner message={message} />
      <button type="button" onClick={onRetry} className={BUTTON_SECONDARY}>
        Reintentar
      </button>
    </div>
  );
}

/** Los totales de siempre (no dependen del período). */
function TotalsCard({ stats, className }: { stats: AdminStats; className?: string }) {
  const { totals } = stats;
  const isPlatform = stats.scope === "platform";
  const rating =
    totals.averageRating === null
      ? "Sin reseñas"
      : `${totals.averageRating.toLocaleString("es-AR")} ★ (${formatInt(totals.reviews)})`;

  const rows: [string, string][] = isPlatform
    ? [
        ["Usuarios", formatInt(totals.users ?? 0)],
        ["Alumnos", formatInt(totals.students)],
        ["Docentes", formatInt(totals.teachers ?? 0)],
        ["Cursos", `${formatInt(totals.activeCourses)} activos de ${formatInt(totals.courses)}`],
        ["Categorías", formatInt(totals.categories ?? 0)],
        ["Suscripciones activas", formatInt(totals.activeSubscriptions ?? 0)],
        ["Valoración promedio", rating],
      ]
    : [
        ["Cursos", `${formatInt(totals.activeCourses)} activos de ${formatInt(totals.courses)}`],
        ["Alumnos", formatInt(totals.students)],
        ["Inscripciones vigentes", formatInt(totals.enrollments)],
        ["Cursos terminados", formatInt(totals.completedEnrollments)],
        ["Valoración promedio", rating],
      ];

  return (
    <section aria-labelledby="totals-title" className={`${CARD} ${className ?? ""}`}>
      <h3 id="totals-title" className="text-text flex items-center gap-2 font-semibold">
        <Users className="text-primary size-4" aria-hidden />
        {isPlatform ? "La plataforma hoy" : "Mis cursos hoy"}
      </h3>
      <dl className="divide-border mt-3 divide-y">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2 text-sm">
            <dt className="text-text-muted">{label}</dt>
            <dd className="text-text font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RecentEnrollments({ stats, className }: { stats: AdminStats; className?: string }) {
  return (
    <section aria-labelledby="recent-title" className={`${CARD} ${className ?? ""}`}>
      <h3 id="recent-title" className="text-text font-semibold">
        Últimas inscripciones
      </h3>
      {stats.recentEnrollments.length === 0 ? (
        <p className="text-text-muted mt-3 text-sm">Todavía no hay inscripciones.</p>
      ) : (
        <ul className="divide-border mt-3 divide-y">
          {stats.recentEnrollments.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 truncate">
                <span className="text-text font-medium">{e.studentName}</span>
                <span className="text-text-muted"> · {e.courseTitle}</span>
              </span>
              <span className="text-text-muted shrink-0 text-xs">
                {new Date(e.enrolledAt).toLocaleDateString("es-AR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
