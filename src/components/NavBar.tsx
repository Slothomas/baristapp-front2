import { Link, NavLink } from "react-router-dom";
import { getUserMock, logoutMock } from "../api/auth";
import { Menu } from "lucide-react";
import { useState } from "react";
import Notifications from "./Notifications";

export default function NavBar() {
  const user = getUserMock();
  const [open, setOpen] = useState(false);

  const linkBase = "px-3 py-2 rounded-lg hover:bg-gray-100";
  const active = ({ isActive }: { isActive: boolean }) =>
    (isActive ? "bg-gray-100 " : "") + linkBase;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center gap-3 p-3">
        {/* logo / home */}
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-6 w-6 rounded-md bg-brand-600"></span>
          BaristApp
        </Link>

        {/* navegación principal (desktop) */}
        <nav className="hidden md:flex gap-1 ml-2">
          <NavLink to="/app" className={active}>Dashboard</NavLink>
          <NavLink to="/app/jobs" className={active}>Vacantes</NavLink>
          <NavLink to="/app/post" className={active}>Publicar</NavLink>
          <NavLink to="/app/profile" className={active}>Perfil</NavLink>
        </nav>

        {/* menú hamburguesa (mobile) */}
        <button
          className="md:hidden ml-1 p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setOpen(v => !v)}
        >
          <Menu size={18} />
        </button>

        {/* lado derecho (usuario + notificaciones) */}
        <div className="ml-auto flex items-center gap-2">
          {/* campana de notificaciones */}
          <Notifications />

          {user && (
            <span className="hidden sm:inline text-sm text-gray-600">
              Hola, <b>{user.user}</b>
            </span>
          )}

          <button
            className={linkBase}
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
        <div className="md:hidden border-t bg-white">
          <div className="max-w-6xl mx-auto p-2 flex flex-col gap-1">
            <NavLink to="/app" className={active} onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/app/jobs" className={active} onClick={() => setOpen(false)}>
              Vacantes
            </NavLink>
            <NavLink to="/app/post" className={active} onClick={() => setOpen(false)}>
              Publicar
            </NavLink>
            <NavLink to="/app/profile" className={active} onClick={() => setOpen(false)}>
              Perfil
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
