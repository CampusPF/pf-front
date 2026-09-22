"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Lock, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  BUTTON_GHOST_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ErrorBanner,
  Loading,
  StatusBadge,
  SuccessBanner,
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
import { useRevalidateOnFocus } from "@/lib/use-revalidate-on-focus";

/* Listado de cursos para admin (todos, activos e inactivos) o teacher (sólo
   los suyos, filtrados acá por instructor).

   Qué puede hacer cada uno:
   - teacher: crear, editar (datos, precio, temario…), eliminar y restaurar
     SUS cursos.
   - admin: sólo eliminar y restaurar. No crea ni edita nada; para decidir si
     eliminar un curso lo abre en el catálogo ("Ver"), donde tiene acceso a
     todas las lecciones. El back aplica la misma regla (403 si lo intenta).

   TODO(back): no hay `GET /courses?instructorId=`; filtramos en el cliente. */
export default function AdminCoursesList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  // Si otro admin/docente eliminó, restauró o creó un curso mientras esta
  // pestaña estaba de fondo, se entera solo al volver — sin esto, sólo se
  // veía recargando la página a mano.
  useRevalidateOnFocus(load);

  /* La lista se recarga después de cada acción (create/deactivate/restore ya
     hacen lo mismo en sus propios flujos): la pantalla del que actúa siempre
     queda al día sin F5. El aviso de éxito es la confirmación visible de que
     "ya pasó" — sin él, la fila cambiando de estado sola podía leerse como un
     parpadeo en vez de una confirmación. */
  async function run(course: Course, action: () => Promise<unknown>, successMessage: string) {
    setPendingId(course.id);
    setError(null);
    setNotice(null);
    try {
      await action();
      await load();
      setNotice(successMessage);
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setPendingId(null);
      setToDeactivate(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          {courses ? `${courses.length} cursos` : " "}
          {isAdmin && (
            <span className="block text-xs">
              Como administrador podés eliminar o restaurar cursos. Crearlos y editarlos le
              corresponde a cada docente.
            </span>
          )}
        </p>
        {!isAdmin && (
          <Link href="/dashboard/admin/cursos/nuevo" className={BUTTON_PRIMARY}>
            <Plus className="size-4" aria-hidden />
            Nuevo curso
          </Link>
        )}
      </div>

      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}

      {!courses && !error && <Loading label="Cargando cursos…" />}

      {courses?.length === 0 && (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-10 text-center text-sm">
          {isAdmin ? "Todavía no hay cursos." : "Todavía no tenés cursos asignados."}
        </p>
      )}

      {courses && courses.length > 0 && (
        <div className="border-border relative overflow-x-auto rounded-xl border">
          {/* relative: los sr-only de la tabla son position:absolute. Sin un
              ancestro posicionado DENTRO del scroll, escapan del overflow-x-auto
              y ensanchan toda la página en mobile (el viewport crecía a ~670px). */}
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
                // Sólo importa para el docente: un admin siempre puede
                // restaurar cualquier curso, esté bloqueado por quien esté.
                const blockedForTeacher = !isAdmin && !active && Boolean(course.deactivatedByAdmin);
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
                      <StatusBadge active={active} blocked={blockedForTeacher} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {isAdmin ? (
                          // Un curso inactivo no está en el catálogo público:
                          // no hay página que abrir.
                          active && (
                            <Link
                              href={`/courses/${course.slug}`}
                              className={BUTTON_SECONDARY}
                              aria-label={`Ver ${course.title} en el catálogo`}
                            >
                              <Eye className="size-3.5" aria-hidden />
                              Ver
                            </Link>
                          )
                        ) : (
                          <Link href={`/dashboard/admin/cursos/${course.id}`} className={BUTTON_SECONDARY}>
                            <Pencil className="size-3.5" aria-hidden />
                            Editar
                          </Link>
                        )}
                        {active ? (
                          <button
                            type="button"
                            onClick={() => setToDeactivate(course)}
                            disabled={pendingId === course.id}
                            className={BUTTON_GHOST_DANGER}
                            aria-label={`Eliminar ${course.title}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        ) : blockedForTeacher ? (
                          // Un admin lo bajó: nada de "Restaurar" acá — el
                          // docente no puede reactivarlo por su cuenta (podría
                          // haberlo bajado por contenido inadecuado). El botón
                          // deshabilitado explica el porqué en vez de
                          // desaparecer sin dar pistas.
                          <button
                            type="button"
                            disabled
                            title="Un administrador desactivó este curso. Sólo un administrador puede restaurarlo."
                            aria-label={`${course.title}: sólo un administrador puede restaurarlo`}
                            className={`${BUTTON_SECONDARY} cursor-not-allowed`}
                          >
                            <Lock className="size-3.5" aria-hidden />
                            Restaurar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              run(course, () => restoreCourse(course.id), `"${course.title}" fue restaurado.`)
                            }
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
        title="¿Eliminar el curso?"
        description={`"${toDeactivate?.title ?? ""}" deja de aparecer en el catálogo. Los alumnos inscriptos no pierden su progreso y lo podés restaurar cuando quieras.`}
        confirmLabel="Sí, eliminar"
        isPending={pendingId !== null}
        onConfirm={() =>
          toDeactivate &&
          run(
            toDeactivate,
            () => deactivateCourse(toDeactivate.id),
            `"${toDeactivate.title}" fue eliminado del catálogo.`,
          )
        }
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}
