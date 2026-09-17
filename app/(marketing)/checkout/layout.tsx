import type { Metadata } from "next";
import { Suspense } from "react";

import BlockAdminFromCheckout from "@/components/auth/BlockAdminFromCheckout";
import RequireAuth from "@/components/auth/RequireAuth";

/* El checkout requiere sesión — hay que poder atribuirle la compra/
   inscripción a un usuario. Vive en (marketing) para heredar el Navbar/
   Footer del resto del sitio (antes colgaba directo de app/, sin chrome).
   Ver components/auth/RequireAuth.tsx para el porqué de que sea client-side.
   El admin no pasa: ya tiene acceso a todo (BlockAdminFromCheckout). El
   docente sí: compra cursos pagos ajenos como cualquier alumno. */
// La página es client component y no puede exportar metadata: va en el layout.
export const metadata: Metadata = {
  title: "Checkout — Campus",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <RequireAuth>
        <BlockAdminFromCheckout>{children}</BlockAdminFromCheckout>
      </RequireAuth>
    </Suspense>
  );
}
