import type { Metadata } from "next";

import MyCoursesView from "@/components/dashboard/MyCoursesView";

export const metadata: Metadata = {
  title: "Mis cursos — Campus",
  description: "Todos los cursos en los que estás inscripto y tu progreso en cada uno.",
};

/* Cae bajo app/(app)/layout.tsx, así que ya viene con RequireAuth, el shell
   del dashboard y DashboardDataProvider (de donde salen las inscripciones). */
export default function MisCursosPage() {
  return <MyCoursesView />;
}
