"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CreditCard, FolderTree, GraduationCap, Plus, Users } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, Loading } from "@/components/admin/admin-ui";
import { getAdminStats, type AdminStats } from "@/services/admin/admin.service";

/* Resumen del admin. Todas las métricas son REALES (se cuentan los listados
   de admin); si alguna falla se muestra "—" y el resto sigue.
   TODO(back): ingresos, cursos más vendidos y actividad en el tiempo no
   tienen endpoint. */
export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let cancelled = false;
    getAdminStats().then((data) => {
      if (!cancelled) setStats(data);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  // El resumen es sólo para admin; el teacher va directo a sus cursos.
  if (user?.role !== "admin") {
    return (
      <div className={CARD}>
        <p className="text-text-secondary text-sm">
          Desde acá gestionás los cursos que dictás.
        </p>
        <Link href="/dashboard/admin/cursos" className={`${BUTTON_PRIMARY} mt-4`}>
          Ver mis cursos
        </Link>
      </div>
    );
  }

  if (!stats) return <Loading label="Cargando métricas…" />;

  const cards = [
    { label: "Usuarios", value: stats.users, icon: Users },
    {
      label: "Cursos",
      value: stats.courses,
      hint: stats.activeCourses !== null ? `${stats.activeCourses} activos` : undefined,
      icon: BookOpen,
    },
    { label: "Categorías", value: stats.categories, icon: FolderTree },
    { label: "Inscripciones", value: stats.enrollments, icon: GraduationCap },
    { label: "Suscripciones activas", value: stats.activeSubscriptions, icon: CreditCard },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/admin/cursos/nuevo" className={BUTTON_PRIMARY}>
          <Plus className="size-4" aria-hidden />
          Nuevo curso
        </Link>
        <Link href="/dashboard/admin/categorias" className={BUTTON_SECONDARY}>
          Gestionar categorías
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className={CARD}>
            <Icon className="text-primary size-5" aria-hidden />
            <p className="text-text mt-3 text-2xl font-bold tabular-nums">{value ?? "—"}</p>
            <p className="text-text-muted text-xs">{label}</p>
            {hint && <p className="text-text-muted mt-0.5 text-[11px]">{hint}</p>}
          </div>
        ))}
      </div>

      <section className={CARD} aria-labelledby="recent-title">
        <h2 id="recent-title" className="text-text font-semibold">
          Últimas inscripciones
        </h2>
        {stats.recentEnrollments.length === 0 ? (
          <p className="text-text-muted mt-3 text-sm">Todavía no hay inscripciones.</p>
        ) : (
          <ul className="divide-border mt-3 divide-y">
            {stats.recentEnrollments.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
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
    </div>
  );
}
