import type { Metadata } from "next";

import CourseCatalog from "@/components/course/CourseCatalog";

export const metadata: Metadata = {
  title: "Cursos — Campus",
  description:
    "Catálogo de cursos de Campus: rutas estructuradas con proyectos reales y un tutor de IA en cada lección.",
};

/* Se renderiza en cada request: sin esto Next prerenderiza la página en el
   build, y si el back no está levantado en ese momento el catálogo queda
   vacío "congelado" hasta el próximo deploy. */
export const dynamic = "force-dynamic";

export default async function CoursesPage(props: PageProps<"/courses">) {
  const params = await props.searchParams;

  return (
    <main className="bg-bg flex-1">
      {/* pt-28: aire para el Navbar fijo. */}
      <CourseCatalog
        params={params}
        basePath="/courses"
        className="mx-auto max-w-6xl px-6 pt-28 pb-20"
      />
    </main>
  );
}
