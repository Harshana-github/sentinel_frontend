import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import ProductLogo from '../components/ProductLogo';
import { selectBranding } from '../features/branding/brandingSlice';

// On small screens the sidebar slides in from the left; from `lg` up it is always visible.
// The Super Admin panel uses a violet accent so the two panels are easy to tell apart.
export default function Sidebar({ navSections, panelLabel, isAdminPanel, isOpen, onClose }) {
  function handleKeyDown(event) {
    if (event.key === 'Escape') onClose();
  }

  const branding = useSelector(selectBranding);
  const activeClasses = isAdminPanel ? 'bg-violet-600 text-white' : 'bg-blue-600 text-white';

  return (
    <aside
      id="app-sidebar"
      onKeyDown={handleKeyDown}
      className={`fixed inset-y-0 left-0 z-40 w-62 overflow-y-auto bg-slate-900 px-3.5 py-5 text-slate-300 transition-transform duration-200 lg:visible lg:translate-x-0 ${
        isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
      }`}
    >
      <div className="flex items-center gap-2.5 px-2 pb-5 text-white">
        <ProductLogo src={branding.productLogo} className={isAdminPanel ? 'text-violet-400' : 'text-blue-400'} />
        <div className="min-w-0">
          <strong className="block truncate text-[17px]">{branding.productName}</strong>
          <span className="text-xs text-slate-500">{panelLabel}</span>
        </div>
      </div>

      <nav aria-label="Main navigation">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4.5">
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{section.title}</p>
            <ul>
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-md px-2.5 py-2 font-medium hover:no-underline ${
                        isActive ? activeClasses : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {branding.company.name && (
        <p className="mt-2 flex items-center gap-2 border-t border-slate-800 px-2 pt-4 text-[11px] text-slate-500">
          {branding.company.logo && <img src={branding.company.logo} alt="" className="size-4 object-contain" />}
          Developed by {branding.company.name}
        </p>
      )}
    </aside>
  );
}
