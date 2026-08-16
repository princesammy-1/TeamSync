import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { can } from "../constants/roles";

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <span
        className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
        aria-label="Loading"
      />
    </div>
  );
}

export function ProtectedRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (currentUser) return <Navigate to="/app" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!can(currentUser.role, "manageMembers")) {
    return <Navigate to="/app" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
