import { apiFetch } from "@/services/api-client";
import type { PaginatedResponse } from "@/services/api.types";

/* Campanita: notificaciones in-app del backend (foros hoy, otras a futuro). */

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function listMyNotifications(page = 1, signal?: AbortSignal) {
  return apiFetch<PaginatedResponse<AppNotification>>("/notifications/me", {
    auth: true,
    query: { page, limit: 20 },
    signal,
  });
}

export async function getUnreadNotificationCount(signal?: AbortSignal): Promise<number> {
  const result = await apiFetch<{ count: number }>("/notifications/me/unread-count", { auth: true, signal });
  return result.count;
}

export function markNotificationRead(id: string) {
  return apiFetch<AppNotification>(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH", auth: true });
}

export function markAllNotificationsRead() {
  return apiFetch<{ updated: number }>("/notifications/me/read-all", { method: "PATCH", auth: true });
}
