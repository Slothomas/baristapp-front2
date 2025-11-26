// src/components/NavBar.tsx
import { Link, NavLink } from "react-router-dom";
import { getUserMock, logoutMock } from "../api/auth";
import { Menu } from "lucide-react";
import { useState } from "react";
import Notifications from "./Notifications";

export default function NavBar() {
  const user = getUserMock();
  const [open, setOpen] = useState(false);

  // ESTILOS LINKS DESKTOP
  const linkBase =
    "px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition";
  const active = ({ isActive }: { isActive: boolean }) =>
    (isActive ? "bg-white/20 text-white " : "") + linkBase;

  // ESTILOS LINKS MOBILE
  const mobileLinkBase =
    "px-3 py-2 rounded-lg text-sm font-medium text-[#7A3EFA] hover:bg-purple-50";
  const activeMobile = ({ isActive }: { isActive: boolean }) =>
    (isActive ? "bg-purple-100 text-[#5b2ac0] " : "") + mobileLinkBase;

  const displayName = user?.name || user?.user || "Usuario";

  return (
    <header className="sticky top-0 z-50 bg-[#7A3EFA] text-white shadow-md">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-3">
        {/* logo / home */}
        <Link
          to="/app"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="inline-block h-7 w-7 rounded-xl bg-white/90" />
          <span className="text-lg">BaristApp</span>
        </Link>

        {/* menú hamburguesa (mobile) */}
        <button
          className="md:hidden ml-1 p-2 rounded-lg hover:bg-white/10"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu size={20} className="text-white" />
        </button>

        {/* lado derecho (usuario + notificaciones) */}
        <div className="ml-auto flex items-center gap-3">
          {/* campana de notificaciones */}
          <div className="flex items-center text-white font-bold">
            <Notifications />
          </div>

          {user && (
            <span className="hidden sm:inline text-sm text-white/90">
              Hola, <span className="font-semibold">{displayName}</span>
            </span>
          )}

          <button
            className="px-3 py-1.5 rounded-lg bg-white text-[#7A3EFA] text-sm font-semibold hover:bg-gray-100 transition"
            onClick={() => {
              logoutMock();
              location.href = "/login";
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* drawer simple para mobile */}
      {open && (
        <div className="md:hidden border-t border-purple-200 bg-white">
          <div className="max-w-6xl mx-auto p-2 flex flex-col gap-1">
            <NavLink
              to="/app"
              className={activeMobile}
              onClick={() => setOpen(false)}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/app/jobs"
              className={activeMobile}
              onClick={() => setOpen(false)}
            >
              Vacantes
            </NavLink>
            <NavLink
              to="/app/post"
              className={activeMobile}
              onClick={() => setOpen(false)}
            >
              Publicar
            </NavLink>
            <NavLink
              to="/app/profile"
              className={activeMobile}
              onClick={() => setOpen(false)}
            >
              Perfil
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
