import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ProductLogo from '../components/ProductLogo';
import { selectBranding } from '../features/branding/brandingSlice';
import { useTranslation } from '../i18n';

// A calm, light sidebar. On small screens it slides in from the left; from `lg` up it is
// always visible and can be collapsed to icons only (`collapsed`), with each name as a tooltip.
// The Super Admin panel uses a violet accent so the two panels are easy to tell apart.
export default function Sidebar({ navSections, panelLabel, isAdminPanel, isOpen, onClose, collapsed, onToggleCollapsed }) {
  const { t } = useTranslation();
  const branding = useSelector(selectBranding);
  const accent = isAdminPanel
    ? { logo: 'text-violet-600', active: 'bg-violet-50 text-violet-700 before:bg-violet-600' }
    : { logo: 'text-blue-600', active: 'bg-blue-50 text-blue-700 before:bg-blue-600' };
  // Collapsed styles only apply from `lg` up; the mobile menu always shows the names.
  const whenCollapsed = (classes) => (collapsed ? classes : '');
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      id="app-sidebar"
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
      className={`fixed inset-y-0 left-0 z-40 flex w-62 flex-col border-r border-slate-200 bg-surface transition-[translate,width] duration-200 lg:visible lg:translate-x-0 ${whenCollapsed('lg:w-17')} ${
        isOpen ? 'visible translate-x-0 shadow-xl' : 'invisible -translate-x-full'
      }`}
    >
      <div className={`flex h-15 shrink-0 items-center gap-2.5 border-b border-slate-200 px-5 ${whenCollapsed('lg:justify-center lg:px-0')}`}>
        <ProductLogo src={branding.productLogo} className={accent.logo} />
        <div className={`min-w-0 leading-tight ${whenCollapsed('lg:hidden')}`}>
          <strong className="block truncate text-[15px]">{branding.productName}</strong>
          <span className="block truncate text-[11px] text-slate-500">{panelLabel}</span>
        </div>
      </div>

      <nav aria-label={t('nav.main')} className={`flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 ${whenCollapsed('lg:px-2.5')}`}>
        {navSections.map((section, index) => (
          <div key={section.title} className="mb-5">
            <p className={`truncate px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 ${whenCollapsed('lg:hidden')}`}>
              {t(section.title)}
            </p>
            {/* Collapsed, a thin line separates the sections instead of their titles. */}
            {collapsed && index > 0 && <hr className="mx-2 mb-2 hidden border-slate-200 lg:block" />}
            <ul className="flex flex-col gap-0.5">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onClose}
                    title={collapsed ? t(label) : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 rounded-md px-3 py-2 font-medium hover:no-underline ${whenCollapsed('lg:justify-center lg:px-0')} ${
                        isActive
                          ? `${accent.active} before:absolute before:inset-y-1.5 before:left-0 before:w-0.75 before:rounded-full`
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon size={18} aria-hidden="true" className="shrink-0" />
                    {/* sr-only rather than hidden, so the link keeps its name for screen readers. */}
                    <span className={`truncate ${whenCollapsed('lg:sr-only')}`}>{t(label)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="hidden shrink-0 border-t border-slate-200 p-2.5 lg:block">
        <button
          type="button"
          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 ${whenCollapsed('justify-center px-0')}`}
          aria-controls="app-sidebar"
          aria-expanded={!collapsed}
          title={collapsed ? t('nav.expand') : undefined}
          onClick={onToggleCollapsed}
        >
          <ToggleIcon size={18} aria-hidden="true" className="shrink-0" />
          <span className={collapsed ? 'sr-only' : 'truncate'}>{collapsed ? t('nav.expand') : t('nav.collapse')}</span>
        </button>
      </div>
    </aside>
  );
}
