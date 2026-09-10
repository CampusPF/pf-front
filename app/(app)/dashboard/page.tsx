import type { Metadata } from "next";

import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
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
      <DashboardGreeting />

      <div className="flex flex-col gap-8">
        <ContinueLearningCard />
        <StatsRow />
        <ActiveCoursesSection />
        <RecommendedSection />
      </div>
    </div>
  );
}
