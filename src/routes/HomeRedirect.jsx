import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSlice';
import { homePathFor } from '../utils/roles';

// "/" opens the right panel for whoever is signed in.
export default function HomeRedirect() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  return <Navigate to={isAuthenticated ? homePathFor(user) : '/login'} replace />;
}
