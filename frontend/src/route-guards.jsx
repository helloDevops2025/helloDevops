import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed, getRole } from "./auth";

export function RequireAuth() {
  const loc = useLocation();
  if (!isAuthed()) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}

export function RequireRole({ allow = [] }) {
  const role = getRole();
  if (!role || (allow.length && !allow.includes(role))) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
