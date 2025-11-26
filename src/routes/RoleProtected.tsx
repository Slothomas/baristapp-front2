// src/routes/RoleProtected.tsx
import { Navigate, Outlet } from "react-router-dom";
import { getUserMock, isAuthed } from "../api/auth";
import { normalizeRole, type AppRole } from "../utils/roles";

export default function RoleProtected({ allow }: { allow: AppRole[] }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;

  const user = getUserMock();
  const role = normalizeRole(user);

  if (!allow.includes(role)) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
