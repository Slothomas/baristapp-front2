import { useState, useEffect } from "react";
import { listNotifications, markAsRead } from "../store/notifyStore";
import { Bell } from "lucide-react";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(() => listNotifications());

  useEffect(() => {
    const timer = setInterval(() => setList(listNotifications()), 2000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = list.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full grid place-items-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-xl rounded-lg border overflow-hidden z-50">
          {list.length === 0 ? (
            <div className="p-4 text-sm text-gray-600 text-center">Sin notificaciones</div>
          ) : (
            <ul className="max-h-64 overflow-auto divide-y text-sm">
              {list.map(n => (
                <li
                  key={n.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${
                    n.read ? "text-gray-500" : "font-medium"
                  }`}
                  onClick={() => {
                    markAsRead(n.id);
                    setList(listNotifications());
                  }}
                >
                  {n.message}
                  <div className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString("es-CL")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
