import type { Metadata } from "next";

import { DASHBOARD_USER } from "@/data/dashboard.mock";
import ContinueLearningCard from "@/components/dashboard/ContinueLearningCard";
import StatsRow from "@/components/dashboard/StatsRow";
import ActiveCoursesSection from "@/components/dashboard/ActiveCoursesSection";
import RecommendedSection from "@/components/dashboard/RecommendedSection";

export const metadata: Metadata = {
  title: "Dashboard — Campus",
  description: "Seguí tu progreso, tus cursos activos y lo recomendado para vos.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      {/* Saludo */}
      <header className="mb-6">
        <h1 className="text-text text-2xl font-bold md:text-3xl">
          Hola, {DASHBOARD_USER.name} <span aria-hidden>👋</span>
        </h1>
        <p className="text-text-secondary mt-1">
          Continuá aprendiendo donde lo dejaste hoy
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <ContinueLearningCard />
        <StatsRow />
        <ActiveCoursesSection />
        <RecommendedSection />
      </div>
    </div>
  );
}
