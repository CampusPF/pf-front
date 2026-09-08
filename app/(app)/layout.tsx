import { Suspense } from "react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import RequireAuth from "@/components/auth/RequireAuth";

/* Chrome del área logueada (sidebar + topbar). Route group (app): no agrega
   segmento a la URL, así que /dashboard sigue siendo /dashboard.

   Toda el área requiere sesión — RequireAuth es lo único que decide eso, ver
   su comentario para el porqué de que sea client-side y no proxy.ts. */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <RequireAuth>
        <DashboardShell>{children}</DashboardShell>
      </RequireAuth>
    </Suspense>
  );
}
