import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "../api/auth";

export default function Protected() {
  const loc = useLocation();
  if (!isAuthed()) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}
