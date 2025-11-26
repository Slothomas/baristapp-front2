// src/components/NotificationsDrawer.tsx
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteNotification,
  markNotificationAsRead,
  type Notification,
} from "../api/notifications";

type Props = {
  userId: number | string;
  open: boolean;
  onClose: () => void;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function NotificationsDrawer({ userId, open, onClose }: Props) {
  const qc = useQueryClient();

  const notifications =
    (qc.getQueryData<Notification[]>(["notifications", userId]) as
      | Notification[]
      | undefined) ?? [];

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const markReadMut = useMutation({
    mutationFn: (id: number | string) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications", userId] });
      const prev = qc.getQueryData<Notification[]>(["notifications", userId]);

      qc.setQueryData<Notification[]>(
        ["notifications", userId],
        (old = []) =>
          old.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );

      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications", userId], ctx.prev);
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications", userId] });
      const prev = qc.getQueryData<Notification[]>(["notifications", userId]);

      qc.setQueryData<Notification[]>(
        ["notifications", userId],
        (old = []) => old.filter((n) => n.id !== id)
      );

      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications", userId], ctx.prev);
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />

      {/* drawer */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl flex flex-col">
        <header className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Notificaciones</h3>
            <p className="text-xs text-gray-500">{unreadCount} sin leer</p>
          </div>

          <button
            onClick={onClose}
            className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
          >
            Cerrar
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No tienes notificaciones aún.
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="p-4 hover:bg-gray-50 flex gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-sm font-medium ${
                          n.is_read ? "text-gray-700" : "text-black"
                        }`}
                      >
                        {n.title ?? "Notificación"}
                      </h4>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {formatDate(n.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {n.message ?? ""}
                    </p>

                    {!n.is_read && (
                      <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Nuevo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!n.is_read && (
                      <button
                        onClick={() => markReadMut.mutate(n.id)}
                        className="text-xs px-2 py-1 rounded-md border hover:bg-white"
                        disabled={markReadMut.isPending}
                      >
                        Marcar leída
                      </button>
                    )}
                    <button
                      onClick={() => deleteMut.mutate(n.id)}
                      className="text-xs px-2 py-1 rounded-md border text-red-600 hover:bg-red-50"
                      disabled={deleteMut.isPending}
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
