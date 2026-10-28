import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun } from 'lucide-react';
import { changeTheme } from '../features/ui/uiSlice';
import { useTranslation } from '../i18n';

// Switches between the light and dark theme. The icon and label name the theme it switches to.
export default function ThemeSwitcher() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const isDark = useSelector((state) => state.ui.theme === 'dark');
  const label = isDark ? t('common.switchToLight') : t('common.switchToDark');

  return (
    <button type="button" className="icon-btn" aria-label={label} title={label} onClick={() => dispatch(changeTheme(isDark ? 'light' : 'dark'))}>
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
