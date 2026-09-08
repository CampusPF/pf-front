import { Suspense } from "react";

import RequireAuth from "@/components/auth/RequireAuth";

/* TODO(campus): este layout no puede ocultar el Navbar/Footer del root layout —
   Next compone layouts, no los reemplaza. Para un player realmente inmersivo hay
   que partir las rutas en route groups: (marketing) con Navbar/Footer y (app)
   sin ellos. Mientras tanto, LessonHeader es `fixed h-16 z-50` y va después en el
   DOM que el Navbar, así que lo tapa; el Footer sigue quedando abajo de todo.

   El reproductor de lecciones requiere sesión (el catálogo y el detalle de
   curso quedan públicos a propósito). Ver components/auth/RequireAuth.tsx. */
export default function LearnLayout({
  children,
}: LayoutProps<"/courses/[slug]/learn">) {
  return (
    <Suspense>
      <RequireAuth>
        <div className="bg-bg flex min-h-screen flex-col">{children}</div>
      </RequireAuth>
    </Suspense>
  );
}
