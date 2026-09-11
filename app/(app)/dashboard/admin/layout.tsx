import type { Metadata } from "next";

import RequireRole from "@/components/auth/RequireRole";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Administración — Campus",
};

/* Panel de administración. Hereda RequireAuth + el shell del dashboard de
   app/(app)/layout.tsx; acá sólo se agrega el gate de rol y las pestañas.

   Entran admin y teacher. El teacher ve sólo "Cursos" (los suyos).
   TODO(back): hoy el back sólo deja escribir cursos al admin. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["admin", "teacher"]}>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <AdminNav />
        <div className="mt-6">{children}</div>
      </div>
    </RequireRole>
  );
}
