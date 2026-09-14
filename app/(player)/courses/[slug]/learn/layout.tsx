import { Suspense } from "react";

import RequireAuth from "@/components/auth/RequireAuth";

/* El reproductor vive en su propio route group, (player), y no en
   (marketing): así no hereda el Navbar ni el Footer del sitio y queda a
   pantalla completa, con LessonHeader como única barra. Antes colgaba de
   (marketing) y el Footer aparecía abajo de cada lección. La URL no cambia
   (/courses/[slug]/learn/[lessonId]): los route groups no suman segmentos.

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
