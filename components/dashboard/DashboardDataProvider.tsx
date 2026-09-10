"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import * as dashboardService from "@/services/dashboard/dashboard.service";
import {
  buildDashboardView,
  type DashboardView,
} from "@/services/dashboard/dashboard.view";

/* Trae los datos reales del dashboard una sola vez (por sesión / montaje) y los
   comparte con todas las secciones vía Context. Vive en app/(app)/layout.tsx,
   adentro de <RequireAuth>, así que sólo se monta con sesión confirmada y el
   sidebar/topbar (que están en el layout, no en la página) también lo ven.

   `enrollments` es el dato central: si falla, el dashboard queda en error.
   `progress` y `subscriptions` son mejoras — si fallan, se degradan solas
   (cero lecciones completadas, plan FREE) y el resto se muestra igual. */

interface DashboardDataValue {
  data: DashboardView | null;
  isLoading: boolean;
  error: string | null;
}

const DashboardDataContext = createContext<DashboardDataValue | null>(null);

export function useDashboardData(): DashboardDataValue {
  const value = useContext(DashboardDataContext);

  if (!value) {
    throw new Error(
      "useDashboardData tiene que usarse adentro de <DashboardDataProvider>",
    );
  }

  return value;
}

export default function DashboardDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<DashboardDataValue>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    // El estado inicial ya es { isLoading: true }, y <RequireAuth> desmonta
    // este árbol al cerrar sesión, así que el provider siempre arranca limpio
    // — no hace falta resetear el estado antes del fetch.
    const controller = new AbortController();

    Promise.all([
      dashboardService.getMyEnrollments(controller.signal),
      dashboardService.getMyLessonProgress(controller.signal).catch(() => []),
      dashboardService.getMySubscriptions(controller.signal).catch(() => []),
    ])
      .then(([enrollments, progress, subscriptions]) => {
        if (controller.signal.aborted) return;
        setState({
          data: buildDashboardView({ enrollments, progress, subscriptions }),
          isLoading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          data: null,
          isLoading: false,
          error:
            err instanceof Error
              ? err.message
              : "No pudimos cargar tu dashboard.",
        });
      });

    return () => controller.abort();
  }, [isAuthenticated]);

  return (
    <DashboardDataContext.Provider value={state}>
      {children}
    </DashboardDataContext.Provider>
  );
}
