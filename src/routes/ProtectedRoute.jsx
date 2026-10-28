import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSlice';
import { homePathFor, isSuperAdmin } from '../utils/roles';

// Guards one panel: panel="admin" for the Super Admin, panel="user" for organization users.
// Signed-out users go to the login page; users of the other panel go to their own home page.
// This only hides pages. The backend must still check the token and role on every request.
export default function ProtectedRoute({ panel }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userPanel = isSuperAdmin(user) ? 'admin' : 'user';
  if (panel !== userPanel) {
    return <Navigate to={homePathFor(user)} replace />;
  }
  return <Outlet />;
}
