import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useConfirm } from '../components/ConfirmDialog';
import { selectCurrentUser } from '../features/auth/authSlice';
import { logout } from '../features/auth/authThunks';
import { showToast } from '../features/ui/uiSlice';
import { useTranslation } from '../i18n';

export default function Topbar({ isSidebarOpen, onToggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { t, roleName } = useTranslation();
  const user = useSelector(selectCurrentUser);

  async function handleLogout() {
    if (!(await confirm({ title: t('auth.signOutTitle'), message: t('auth.signOutMessage'), confirmLabel: t('auth.signOut') }))) return;
    await dispatch(logout());
    // A plain /login, so the next person who signs in starts on their own home page.
    navigate('/login', { replace: true });
    dispatch(showToast({ message: t('auth.signedOut') }));
  }

  const initials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:px-6">
      <button
        type="button"
        className="icon-btn lg:hidden"
        aria-label={t('nav.toggle')}
        aria-controls="app-sidebar"
        aria-expanded={isSidebarOpen}
        onClick={onToggleSidebar}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <LanguageSwitcher />
        <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
        <span className="grid size-8.5 place-items-center rounded-full bg-blue-50 text-[13px] font-bold text-blue-700" aria-hidden="true">
          {initials}
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <strong className="text-[13px]">{user?.name}</strong>
          <span className="text-xs text-slate-500">{user?.organizationName ? `${roleName(user)} · ${user.organizationName}` : roleName(user)}</span>
        </span>
        <button type="button" className="icon-btn" aria-label={t('auth.signOut')} title={t('auth.signOut')} onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
