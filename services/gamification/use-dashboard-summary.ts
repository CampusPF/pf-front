"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "@/services/gamification/gamification.service";

/* Mismo patrón que services/progress/use-progress-stats.ts (useStreak /
   useStudiedTime): useEffect + AbortController, sin React Query. Se duplican
   ~15 líneas de un hook genérico en vez de compartirlo entre los dos
   archivos — son módulos de conceptos distintos (racha/horas vs.
   nivel/logros) y no vale la pena acoplarlos por esto. */

export type RemoteValue<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; value: T };

export function useDashboardSummary(): RemoteValue<DashboardSummary> {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<RemoteValue<DashboardSummary>>({
    status: "loading",
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();

    getDashboardSummary(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setState({ status: "success", value });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });

    return () => controller.abort();
  }, [isAuthenticated]);

  return state;
}
