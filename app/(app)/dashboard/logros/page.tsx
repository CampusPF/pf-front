import type { Metadata } from "next";

import AchievementsView from "@/components/achievements/AchievementsView";

export const metadata: Metadata = {
  title: "Logros — Campus",
  description: "Tus logros en Campus: los que ya conseguiste y qué te falta para el resto.",
};

/* Cae bajo app/(app)/layout.tsx: ya viene con RequireAuth y el shell del
   dashboard. Los datos (GET /me/achievements) se cargan en el cliente
   porque el token vive en localStorage. */
export default function LogrosPage() {
  return <AchievementsView />;
}
