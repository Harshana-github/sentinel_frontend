import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSlice';
import { homePathFor } from '../utils/roles';

// Sends signed-in users away from the login page, back to where they were going.
// If that page belongs to the other panel, ProtectedRoute redirects them home.
export default function PublicOnlyRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from;
    const destination = from && from.pathname !== '/login' ? `${from.pathname}${from.search}` : homePathFor(user);
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}
