import type { Metadata } from "next";
import { Suspense } from "react";

import BlockStaffFromCheckout from "@/components/auth/BlockStaffFromCheckout";
import RequireAuth from "@/components/auth/RequireAuth";

/* El checkout requiere sesión — hay que poder atribuirle la compra/
   inscripción a un usuario. Vive en (marketing) para heredar el Navbar/
   Footer del resto del sitio (antes colgaba directo de app/, sin chrome).
   Ver components/auth/RequireAuth.tsx para el porqué de que sea client-side.
   Admin y teacher no pasan: ya tienen acceso a todo (BlockStaffFromCheckout). */
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
        <BlockStaffFromCheckout>{children}</BlockStaffFromCheckout>
      </RequireAuth>
    </Suspense>
  );
}
