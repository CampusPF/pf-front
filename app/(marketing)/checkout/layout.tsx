import { Suspense } from "react";

import RequireAuth from "@/components/auth/RequireAuth";

/* El checkout requiere sesión — hay que poder atribuirle la compra/
   inscripción a un usuario. Vive en (marketing) para heredar el Navbar/
   Footer del resto del sitio (antes colgaba directo de app/, sin chrome).
   Ver components/auth/RequireAuth.tsx para el porqué de que sea client-side. */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <RequireAuth>{children}</RequireAuth>
    </Suspense>
  );
}
