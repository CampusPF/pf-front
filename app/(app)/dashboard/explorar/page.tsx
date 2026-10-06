import type { Metadata } from "next";

import CourseCatalog from "@/components/course/CourseCatalog";

export const metadata: Metadata = {
  title: "Explorar cursos — Campus",
  description: "Catálogo de cursos de Campus, sin salir del dashboard.",
};

// Mismo motivo que /courses: el catálogo se pide en cada request.
export const dynamic = "force-dynamic";

/* El mismo catálogo que /courses, pero bajo app/(app)/layout.tsx: así el
   ítem "Explorar" del sidebar no saca al usuario del dashboard. */
export default async function ExplorarPage(
  props: PageProps<"/dashboard/explorar">,
) {
  const params = await props.searchParams;

  return (
    <CourseCatalog
      params={params}
      basePath="/dashboard/explorar"
      className="mx-auto max-w-6xl px-4 py-8 md:px-6"
    />
  );
}
