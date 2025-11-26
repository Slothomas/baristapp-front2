import { http } from "./http";

// ---------------------------------------------------------------------------
// TIPOS (Sincronizados con el Backend)
// ---------------------------------------------------------------------------

export type NotificationType =
  | "BARISTA_APPLIED"
  | "NEW_OFFER"
  | "APPLICATION_STATUS"
  | "DEFAULT"
  | string;

export interface Notification {
  id: number;
  user_id: number;
  title?: string | null;
  message?: string | null;
  type?: NotificationType | null;
  payload?: any;
  is_read: boolean;
  created_at: string; // ISO String
  [key: string]: any;
}

export interface CreateNotificationPayload {
  user_id: number;
  title?: string | null;
  message: string;
  type?: NotificationType | null;
  payload?: any;
}

// ---------------------------------------------------------------------------
// ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * POST /notifications/
 * Crea una notificación (uso interno o pruebas).
 */
export async function createNotification(
  payload: CreateNotificationPayload
): Promise<Notification> {
  const res = await http.post<Notification>("/notifications/", payload);
  return res.data;
}

/**
 * GET /notifications/user/{user_id}
 * Obtiene la lista de notificaciones.
 */
export async function getUserNotifications(
  userId: number | string,
  onlyUnread: boolean = false
): Promise<Notification[]> {
  const res = await http.get<Notification[]>(
    `/notifications/user/${userId}`,
    {
      params: { only_unread: onlyUnread },
    }
  );
  return res.data;
}

/**
 * Helper: Trae solo las no leídas.
 */
export function getUnreadNotifications(userId: number | string) {
  return getUserNotifications(userId, true);
}

/**
 * PATCH /notifications/{notification_id}/read
 * Marca una notificación como leída.
 * NOTA: El backend devuelve un objeto simple { success: true }, no la notificación completa.
 */
export async function markNotificationAsRead(
  notificationId: number | string
): Promise<any> {
  const res = await http.patch<any>(
    `/notifications/${notificationId}/read`
  );
  return res.data;
}

/**
 * DELETE /notifications/{notification_id}
 * Elimina una notificación (Soft delete).
 */
export async function deleteNotification(
  notificationId: number | string
): Promise<void> {
  await http.delete(`/notifications/${notificationId}`);
}