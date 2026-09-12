"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UserAvatar from "@/components/ui/UserAvatar";
import { inputClass } from "@/components/ui/input-styles";
import {
  BUTTON_GHOST_DANGER,
  ErrorBanner,
  Loading,
  SuccessBanner,
} from "@/components/admin/admin-ui";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import {
  deleteUser,
  listUsers,
  updateUserRole,
  type AdminUser,
  type UserRole,
} from "@/services/admin/admin.service";

/* Gestión de usuarios: cambiar el rol y dar de baja.

   Dos cosas que la UI bloquea y el back no:
   - El admin no puede tocarse a sí mismo (ni bajarse el rol ni eliminarse).
     Sería dejarse afuera del panel sin manera de volver a entrar desde la
     app — habría que arreglarlo por SQL.
   - Las dos acciones piden confirmación: cambiar un rol le da (o le saca) a
     alguien el control de todo el catálogo.

   TODO(back): el listado no trae los usuarios dados de baja y no hay forma
   de listarlos, así que restaurar uno no se puede ofrecer todavía (el
   endpoint existe: PATCH /users/:id/restore). */

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Estudiante",
  teacher: "Docente",
  admin: "Administrador",
};

const ROLE_HINT: Record<UserRole, string> = {
  student: "Puede cursar, comprar cursos y seguir su progreso.",
  teacher: "Además, gestiona los cursos que dicta.",
  admin: "Control total: cursos, categorías, usuarios y roles.",
};

const STATUS_LABEL: Record<AdminUser["status"], string> = {
  active: "Activo",
  inactive: "Inactivo",
  banned: "Bloqueado",
  deleted: "Eliminado",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

type Pending =
  | { kind: "role"; user: AdminUser; role: UserRole }
  | { kind: "delete"; user: AdminUser };

export default function UsersManager() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await listUsers();
      setUsers([...list].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (caught) {
      setError(adminErrorMessage(caught, "No pudimos cargar los usuarios."));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = normalize(search);
    if (!needle || !users) return users ?? [];
    return users.filter(
      (user) =>
        normalize(user.name).includes(needle) || normalize(user.email).includes(needle),
    );
  }, [users, search]);

  async function confirmPending() {
    if (!pending) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      if (pending.kind === "role") {
        await updateUserRole(pending.user.id, pending.role);
        setNotice(
          `${pending.user.name} ahora es ${ROLE_LABEL[pending.role].toLowerCase()}.`,
        );
      } else {
        await deleteUser(pending.user.id);
        setNotice(`${pending.user.name} fue dado de baja.`);
      }
      await load();
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setIsSaving(false);
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          {users ? `${users.length} ${users.length === 1 ? "usuario" : "usuarios"}` : " "}
        </p>
        <div className="relative w-full sm:w-72">
          <Search
            className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o email…"
            aria-label="Buscar usuarios"
            className={`${inputClass(false)} pl-9`}
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner message={notice} />}

      {!users && !error && <Loading label="Cargando usuarios…" />}

      {users && visible.length === 0 && (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-10 text-center text-sm">
          {search ? "Ningún usuario coincide con la búsqueda." : "Todavía no hay usuarios."}
        </p>
      )}

      {visible.length > 0 && (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-elevated text-text-muted text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Alta</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-border bg-surface divide-y">
              {visible.map((user) => {
                const isSelf = user.id === currentUser?.id;

                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} className="size-9 text-sm" />
                        <div className="min-w-0">
                          <p className="text-text flex items-center gap-2 truncate font-medium">
                            {user.name}
                            {isSelf && (
                              <span className="bg-primary-subtle text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
                                Vos
                              </span>
                            )}
                          </p>
                          <p className="text-text-muted truncate text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-text-secondary px-4 py-3 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-surface-elevated text-text-muted"
                        }`}
                      >
                        {STATUS_LABEL[user.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`role-${user.id}`}>
                        Rol de {user.name}
                      </label>
                      <select
                        id={`role-${user.id}`}
                        value={user.role}
                        disabled={isSelf || isSaving}
                        title={
                          isSelf
                            ? "No podés cambiar tu propio rol: te quedarías sin acceso al panel."
                            : ROLE_HINT[user.role]
                        }
                        onChange={(event) =>
                          setPending({
                            kind: "role",
                            user,
                            role: event.target.value as UserRole,
                          })
                        }
                        className={`${inputClass(false)} w-44 py-2 disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABEL[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setPending({ kind: "delete", user })}
                          disabled={isSelf || isSaving}
                          aria-label={`Eliminar a ${user.name}`}
                          title={
                            isSelf
                              ? "No podés eliminar tu propia cuenta."
                              : `Eliminar a ${user.name}`
                          }
                          className={BUTTON_GHOST_DANGER}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
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
        open={pending !== null}
        variant={pending?.kind === "delete" ? "danger" : "default"}
        title={
          pending?.kind === "delete" ? "¿Dar de baja al usuario?" : "¿Cambiar el rol?"
        }
        description={
          pending?.kind === "delete" ? (
            <>
              <strong>{pending.user.name}</strong> ({pending.user.email}) no va a poder
              iniciar sesión. Sus inscripciones y su progreso quedan guardados, pero la
              cuenta desaparece de esta lista y hoy no se puede restaurar desde el panel.
            </>
          ) : pending ? (
            <>
              <strong>{pending.user.name}</strong> pasa de{" "}
              {ROLE_LABEL[pending.user.role].toLowerCase()} a{" "}
              <strong>{ROLE_LABEL[pending.role].toLowerCase()}</strong>.{" "}
              {ROLE_HINT[pending.role]}
            </>
          ) : null
        }
        confirmLabel={pending?.kind === "delete" ? "Sí, dar de baja" : "Sí, cambiar"}
        isPending={isSaving}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
