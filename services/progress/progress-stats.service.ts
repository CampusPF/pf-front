import { apiFetch } from "@/services/api-client";

/* Racha y minutos estudiados del usuario de la sesión.

   TEMPORAL: GET /me/streak y GET /me/studied-time se reemplazan por un único
   GET /me/dashboard. Este archivo (junto con use-progress-stats.ts) es el
   ÚNICO lugar que sabe de dónde salen estos datos: StreakCard y
   StudiedTimeCard sólo consumen los hooks, así que el cambio queda acá. */

export interface StreakResponse {
  streakDays: number;
}

export interface StudiedTimeResponse {
  minutes: number;
}

export function getStreak(signal?: AbortSignal): Promise<StreakResponse> {
  return apiFetch<StreakResponse>("/me/streak", { auth: true, signal });
}

export function getStudiedTime(signal?: AbortSignal): Promise<StudiedTimeResponse> {
  return apiFetch<StudiedTimeResponse>("/me/studied-time", { auth: true, signal });
}
