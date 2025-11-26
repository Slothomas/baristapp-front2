import { createNotification } from "../api/notifications";

type NotifyArgs = {
  userId: number;
  type: string;
  message: string;
  title?: string;
  payload?: any;
};

export async function notify({
  userId,
  type,
  message,
  title,
  payload,
}: NotifyArgs) {
  try {
    await createNotification({
      user_id: userId,
      type,
      message,
      title: title ?? null,
      payload: payload ?? null,
    });
  } catch (e) {
    // no rompemos el flujo por una notif
    console.warn("notify failed", e);
  }
}
