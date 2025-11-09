import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  PlusSquare,
  User,
  ClipboardList,
  Shield,
  LifeBuoy,
  FileClock,
} from "lucide-react";
import { getUserMock } from "../api/auth";

export default function Sidebar() {
  const user = getUserMock();

  const item =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition";
  const active = ({ isActive }: { isActive: boolean }) =>
    (isActive ? "bg-gray-100 font-semibold " : "") + item;

  return (
    <aside className="hidden md:block w-56 shrink-0 bg-white border-r">
      <div className="sticky top-[56px] p-3">
        <nav className="space-y-1">
          {/* Común */}
          <NavLink to="/app" className={active}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/app/jobs" className={active}>
            <Briefcase size={18} />
            Vacantes
          </NavLink>

          {/* Barista */}
          {user?.role === "barista" && (
            <NavLink to="/app/my-applications" className={active}>
              <FileClock size={18} />
              Mis postulaciones
            </NavLink>
          )}

          {/* Cafetería */}
          <NavLink to="/app/post" className={active}>
            <PlusSquare size={18} />
            Publicar
          </NavLink>
          {user?.role === "cafe" && (
            <NavLink to="/app/jobs/manage" className={active}>
              <ClipboardList size={18} />
              Mis vacantes
            </NavLink>
          )}

          {/* Academia */}
          {user?.role === "academy" && (
            <NavLink to="/app/certificates/upload" className={active}>
              <ClipboardList size={18} />
              Subir certificados
            </NavLink>
          )}

          {/* Perfil */}
          <NavLink to="/app/profile" className={active}>
            <User size={18} />
            Perfil
          </NavLink>

          {/* Admin */}
          {user?.role === "admin" && (
            <NavLink to="/app/admin/users" className={active}>
              <Shield size={18} />
              Admin Usuarios
            </NavLink>
          )}

          {/* Soporte (todos) */}
          <NavLink to="/app/support" className={active}>
            <LifeBuoy size={18} />
            Soporte
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
