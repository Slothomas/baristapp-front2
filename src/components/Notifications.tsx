// src/components/Notifications.tsx
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Trash2,
  CheckCircle2,
  X,
  Briefcase,
  User,
  Info,
} from "lucide-react";
import {
  deleteNotification,
  getUserNotifications,
  markNotificationAsRead,
} from "../api/notifications";
import type { Notification } from "../api/notifications";
import { getCurrentUser } from "../api/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// 🎨 DICCIONARIO DE TEXTOS E ICONOS
const NOTIFICATION_CONFIG: Record<
  string,
  { title: string; icon: any; color: string }
> = {
  BARISTA_APPLIED: {
    title: "Postulación enviada",
    icon: User,
    color: "text-blue-600 bg-blue-100",
  },
  NEW_OFFER: {
    title: "Nueva Oferta Disponible",
    icon: Briefcase,
    color: "text-green-600 bg-green-100",
  },
  APPLICATION_STATUS: {
    title: "Estado de Postulación",
    icon: Info,
    color: "text-purple-600 bg-purple-100",
  },
  DEFAULT: {
    title: "Notificación",
    icon: Bell,
    color: "text-gray-600 bg-gray-100",
  },
};

function getNotificationDetails(n: Notification) {
  const typeKey =
    n.type && NOTIFICATION_CONFIG[n.type] ? n.type : "DEFAULT";
  const config = NOTIFICATION_CONFIG[typeKey];

  const title = n.title || config.title;
  const message =
    n.message ||
    (n.type === "BARISTA_APPLIED"
      ? "Tu postulación se ha registrado correctamente."
      : "Tienes una nueva actualización.");

  return { ...config, title, message };
}

export default function Notifications() {
  const user = getCurrentUser();
  const userId = user?.id ? Number(user.id) : null;

  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // filtro visual "solo no leídas"
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryKey = useMemo(
    () => ["notifications", userId],
    [userId]
  );

  const {
    data: rawList = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Notification[]>({
    queryKey,
    queryFn: () => getUserNotifications(userId!),
    enabled: !!userId && !Number.isNaN(userId),
    refetchInterval: 15000,
  });

  // 🔴 contador de alerta (todas las notis sin leer)
  const unreadCount = rawList.filter((n) => !n.is_read).length;

  // 📦 lista base que se mostrará (por ahora sin filtros por rol)
  const baseList = rawList;

  // LÓGICA DE FILTRADO (solo no leídas)
  const displayedList = useMemo(() => {
    if (showOnlyUnread) {
      return baseList.filter((n) => !n.is_read);
    }
    return baseList;
  }, [baseList, showOnlyUnread]);

  const markReadMut = useMutation({
    mutationFn: (id: number) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Notification[]>(queryKey) || [];
      qc.setQueryData<Notification[]>(
        queryKey,
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Notification[]>(queryKey) || [];
      qc.setQueryData<Notification[]>(
        queryKey,
        prev.filter((n) => n.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) refetch();
  };

  const drawerContent = (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-[9998]"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-[380px] max-w-full bg-white border-l shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-white shadow-sm z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell size={20} className="text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-800">
                  Notificaciones
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Barra de Filtro */}
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                    showOnlyUnread
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {showOnlyUnread && (
                    <CheckCircle2 size={12} className="text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={showOnlyUnread}
                  onChange={(e) => setShowOnlyUnread(e.target.checked)}
                  className="hidden"
                />
                Solo no leídas
              </label>

              <button
                onClick={() => refetch()}
                className="text-xs font-medium px-2 py-1 rounded hover:bg-white hover:shadow-sm text-gray-500 transition-all"
              >
                Refrescar
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            {isLoading && (
              <div className="p-10 flex flex-col items-center text-gray-400 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full mb-3" />
                <p className="text-sm">Cargando...</p>
              </div>
            )}

            {isError && (
              <div className="p-4 m-4 rounded bg-red-50 text-sm text-red-600 border border-red-100">
                No se pudieron cargar las notificaciones.
              </div>
            )}

            {!isLoading && !isError && displayedList.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                  {showOnlyUnread ? (
                    <CheckCircle2 size={32} className="opacity-20" />
                  ) : (
                    <Bell size={32} className="opacity-20" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {showOnlyUnread ? "Todo al día" : "Bandeja vacía"}
                </p>
                <p className="text-xs mt-1 text-center px-6">
                  {showOnlyUnread
                    ? "No tienes mensajes pendientes. Desactiva el filtro para ver el historial."
                    : "No hay notificaciones para mostrar."}
                </p>
              </div>
            )}

            {!isLoading && !isError && displayedList.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {displayedList.map((n) => {
                  const { title, message, icon: Icon, color } =
                    getNotificationDetails(n);

                  return (
                    <li
                      key={n.id}
                      className={`group relative p-4 transition-all duration-200 hover:bg-white hover:shadow-sm ${
                        n.is_read
                          ? "bg-gray-50 opacity-75 grayscale-[0.3]"
                          : "bg-white border-l-4 border-blue-500"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${color}`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4
                              className={`text-sm font-semibold mb-0.5 truncate pr-2 ${
                                n.is_read
                                  ? "text-gray-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {title}
                            </h4>
                            <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded">
                              {new Date(
                                n.created_at
                              ).toLocaleDateString("es-CL", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>

                          <p
                            className="text-sm text-gray-600 leading-snug mb-2 line-clamp-2 cursor-pointer"
                            onClick={() =>
                              !n.is_read && markReadMut.mutate(n.id)
                            }
                          >
                            {message}
                          </p>

                          <div className="flex items-center gap-3 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            {!n.is_read && (
                              <button
                                onClick={() => markReadMut.mutate(n.id)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                              >
                                <CheckCircle2 size={12} />
                                Marcar leída
                              </button>
                            )}
                            <button
                              onClick={() => deleteMut.mutate(n.id)}
                              className="text-xs font-medium text-gray-400 hover:text-red-600 flex items-center gap-1 ml-auto transition-colors"
                            >
                              <Trash2 size={12} />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <div className="relative">
        <button
          onClick={handleOpen}
          className="relative p-2 rounded-full transition-all duration-200 hover:bg-white/10 text-white"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          )}
        </button>
      </div>
      {mounted ? createPortal(drawerContent, document.body) : null}
    </>
  );
}
