"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  getStreak,
  getStudiedTime,
} from "@/services/progress/progress-stats.service";

/* Hooks de racha y horas estudiadas. El proyecto no usa React Query: es el
   mismo useEffect + AbortController que DashboardDataProvider.

   Cada hook es independiente a propósito: si falla uno, la otra tarjeta y el
   resto del dashboard siguen andando. No hay timeout que corte el request: con
   el back de Render dormido la respuesta puede tardar, el skeleton se queda y
   el aviso global de BackendWakeNotice explica la espera. */

export type RemoteValue<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; value: T };

function useRemoteValue<T>(load: (signal: AbortSignal) => Promise<T>): RemoteValue<T> {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<RemoteValue<T>>({ status: "loading" });

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    load(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setState({ status: "success", value });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });

    return () => controller.abort();
  }, [isAuthenticated, load]);

  return state;
}

/* Fuera del componente para que la referencia sea estable (dependencia del
   efecto). Normalizan a número por si el back manda algo raro. */
const loadStreakDays = (signal: AbortSignal) =>
  getStreak(signal).then((res) => Math.max(0, Number(res.streakDays) || 0));

const loadStudiedMinutes = (signal: AbortSignal) =>
  getStudiedTime(signal).then((res) => Math.max(0, Number(res.minutes) || 0));

/** Días seguidos de actividad. */
export function useStreak(): RemoteValue<number> {
  return useRemoteValue(loadStreakDays);
}

/** Minutos estudiados en total. */
export function useStudiedTime(): RemoteValue<number> {
  return useRemoteValue(loadStudiedMinutes);
}
