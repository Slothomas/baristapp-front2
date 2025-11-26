// src/types/notifications.ts

export type NotificationType =
  | "BARISTA_APPLIED"
  | "CAFE_SELECTED"
  | "CAFE_REJECTED"
  | "ASSIGNMENT_CREATED"
  | "JOB_CLOSED"
  | string;

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO
  meta?: Record<string, any>;
}
