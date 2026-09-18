import { apiFetch } from "@/services/api-client";

/* `GET /me/dashboard`: nivel, XP y logros del usuario de la sesión.

   Racha y horas estudiadas TAMBIÉN vienen en esta respuesta, pero acá no se
   leen: StreakCard/StudiedTimeCard ya las consumen de
   services/progress/progress-stats.service.ts (endpoints temporales que
   siguen funcionando) y no hace falta duplicar esa lógica ni arriesgar
   tocarla la noche antes de la demo. Este service es SOLO para lo que todavía
   no existía en el front: nivel, XP y logros. */

export interface UnlockedAchievement {
  code: string;
  nombre: string;
  icono: string;
  unlockedAt: string;
}

export interface LockedAchievement {
  code: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

export interface DashboardSummary {
  nivel: number;
  xp: number;
  xpDelNivel: number;
  /** `null` = nivel máximo: no hay barra de progreso que mostrar. */
  xpParaElSiguiente: number | null;
  rachaDias: number;
  minutosEstudiados: number;
  cursosActivos: number;
  cursosCompletados: number;
  logros: UnlockedAchievement[];
  logrosBloqueados: LockedAchievement[];
}

export function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/me/dashboard", { auth: true, signal });
}
