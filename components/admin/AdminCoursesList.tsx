"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  BUTTON_GHOST_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ErrorBanner,
  Loading,
  StatusBadge,
} from "@/components/admin/admin-ui";
import CourseCover from "@/components/course/CourseCover";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import {
  deactivateCourse,
  listAdminCourses,
  restoreCourse,
} from "@/services/admin/admin.service";
import { formatPrice } from "@/types/checkout";
import type { Course } from "@/types/course.types";

/* Listado de cursos para admin (todos, activos e inactivos) o teacher (sólo
   los suyos, filtrados acá por instructor).
   TODO(back): no hay `GET /courses?instructorId=`; filtramos en el cliente. */
export default function AdminCoursesList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Course | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await listAdminCourses();
      setCourses(isAdmin ? all : all.filter((c) => c.instructor.id === user?.id));
    } catch (caught) {
      setError(adminErrorMessage(caught));
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function run(course: Course, action: () => Promise<unknown>) {
    setPendingId(course.id);
    setError(null);
    try {
      await action();
      await load();
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setPendingId(null);
      setToDeactivate(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          {courses ? `${courses.length} cursos` : " "}
        </p>
        <Link href="/dashboard/admin/cursos/nuevo" className={BUTTON_PRIMARY}>
          <Plus className="size-4" aria-hidden />
          Nuevo curso
        </Link>
      </div>

      {error && <ErrorBanner message={error} />}

      {!courses && !error && <Loading label="Cargando cursos…" />}

      {courses?.length === 0 && (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-10 text-center text-sm">
          {isAdmin ? "Todavía no hay cursos." : "Todavía no tenés cursos asignados."}
        </p>
      )}

      {courses && courses.length > 0 && (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-elevated text-text-muted text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Curso</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Precio</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-border bg-surface divide-y">
              {courses.map((course) => {
                const active = course.isActive !== false;
                return (
                  <tr key={course.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CourseCover course={course} className="h-10 w-16 shrink-0 rounded-md" />
                        <div className="min-w-0">
                          <p className="text-text truncate font-medium">{course.title}</p>
                          <p className="text-text-muted truncate text-xs">
                            {course.levelLabel} · {course.instructor.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-text-secondary px-4 py-3">{course.categoryLabel}</td>
                    <td className="text-text-secondary px-4 py-3">
                      {course.isPremium ? formatPrice(course.priceInCents, course.currency) : "Gratis"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/admin/cursos/${course.id}`} className={BUTTON_SECONDARY}>
                          <Pencil className="size-3.5" aria-hidden />
                          Editar
                        </Link>
                        {active ? (
                          <button
                            type="button"
                            onClick={() => setToDeactivate(course)}
                            disabled={pendingId === course.id}
                            className={BUTTON_GHOST_DANGER}
                            aria-label={`Desactivar ${course.title}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => run(course, () => restoreCourse(course.id))}
                            disabled={pendingId === course.id}
                            className={BUTTON_SECONDARY}
                          >
                            <RotateCcw className="size-3.5" aria-hidden />
                            Restaurar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={toDeactivate !== null}
        variant="danger"
        title="¿Desactivar el curso?"
        description={`"${toDeactivate?.title ?? ""}" deja de aparecer en el catálogo. Los alumnos inscriptos no pierden su progreso y lo podés restaurar cuando quieras.`}
        confirmLabel="Sí, desactivar"
        isPending={pendingId !== null}
        onConfirm={() => toDeactivate && run(toDeactivate, () => deactivateCourse(toDeactivate.id))}
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}
