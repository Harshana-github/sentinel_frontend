import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { selectCurrentUser } from '../features/auth/authSlice';
import { logout } from '../features/auth/authThunks';
import { showToast } from '../features/ui/uiSlice';

export default function Topbar({ isSidebarOpen, onToggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  async function handleLogout() {
    await dispatch(logout());
    // A plain /login, so the next person who signs in starts on their own home page.
    navigate('/login', { replace: true });
    dispatch(showToast({ message: 'You have been signed out.' }));
  }

  const initials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-6">
      <button
        type="button"
        className="icon-btn lg:hidden"
        aria-label="Toggle navigation"
        aria-controls="app-sidebar"
        aria-expanded={isSidebarOpen}
        onClick={onToggleSidebar}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="ml-auto flex items-center gap-2.5">
        <span className="grid size-8.5 place-items-center rounded-full bg-blue-50 text-[13px] font-bold text-blue-600" aria-hidden="true">
          {initials}
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <strong>{user?.name}</strong>
          <span className="text-xs text-slate-500">
            {user?.organizationName ? `${user.role} · ${user.organizationName}` : user?.role}
          </span>
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </header>
  );
}
