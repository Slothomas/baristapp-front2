// src/components/Sidebar.tsx
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
  Star,   // ⭐ Nuevo ícono
} from "lucide-react";
import { getUserMock } from "../api/auth";

type AppRole = "barista" | "cafe" | "academy" | "admin" | "unknown";

function normalizeRole(user: any): AppRole {
  const raw =
    (user?.role ?? user?.clave ?? user?.user_type ?? user?.tipo ?? "")
      .toString()
      .toLowerCase()
      .trim();

  if (raw === "barista" || raw === "worker" || raw === "freelancer")
    return "barista";
  if (raw === "cafe" || raw === "client" || raw === "restaurant" || raw === "cafeteria")
    return "cafe";
  if (raw === "academy" || raw === "escuela" || raw === "training_center")
    return "academy";
  if (raw === "admin" || raw === "administrator") return "admin";
  return "unknown";
}

export default function Sidebar() {
  const user = getUserMock();
  const role = normalizeRole(user);

  const item =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition";
  const active = ({ isActive }: { isActive: boolean }) =>
    (isActive ? "bg-gray-100 font-semibold " : "") + item;

  return (
    <aside className="hidden md:block w-56 shrink-0 bg-white border-r relative z-10 pointer-events-none">
      <div className="sticky top-[56px] p-3 pointer-events-auto relative z-20">
        <div className="pointer-events-auto">
          <nav className="space-y-1">
            <NavLink to="/app" className={active}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <NavLink to="/app/jobs" className={active}>
              <Briefcase size={18} />
              Vacantes
            </NavLink>

            {role === "barista" && (
              <NavLink to="/app/my-applications" className={active}>
                <FileClock size={18} />
                Mis postulaciones
              </NavLink>
            )}

            {role === "cafe" && (
              <>
                <NavLink to="/app/post" className={active}>
                  <PlusSquare size={18} />
                  Publicar
                </NavLink>

                <NavLink to="/app/jobs/manage" className={active}>
                  <ClipboardList size={18} />
                  Mis vacantes
                </NavLink>

                <NavLink to="/app/reviews" className={active}>
                  <Star size={18} />
                  Reseñas
                </NavLink>
              </>
            )}

            {role === "academy" && (
              <NavLink to="/app/certificates/upload" className={active}>
                <ClipboardList size={18} />
                Subir certificados
              </NavLink>
            )}

            <NavLink to="/app/profile" className={active}>
              <User size={18} />
              Perfil
            </NavLink>

            {role === "admin" && (
              <NavLink to="/app/admin/users" className={active}>
                <Shield size={18} />
                Admin Usuarios
              </NavLink>
            )}

            <NavLink to="/app/support" className={active}>
              <LifeBuoy size={18} />
              Soporte
            </NavLink>
          </nav>
        </div>
      </div>
    </aside>
  );
}
