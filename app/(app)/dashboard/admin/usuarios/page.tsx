import RequireRole from "@/components/auth/RequireRole";
import UsersManager from "@/components/admin/UsersManager";

/* Sólo admin: un docente no gestiona usuarios ni reparte roles. */
export default function AdminUsersPage() {
  return (
    <RequireRole roles={["admin"]}>
      <UsersManager />
    </RequireRole>
  );
}
