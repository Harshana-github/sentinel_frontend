import { useSelector } from 'react-redux';
import { selectBranding } from '../features/branding/brandingSlice';
import { useTranslation } from '../i18n';

// A quiet credit line fixed to the bottom of the window, next to the sidebar. The company
// comes from the Product & Company page. AppLayout reserves its 32px height (pb-8).
export default function Footer({ sidebarCollapsed }) {
  const { company } = useSelector(selectBranding);
  const { t } = useTranslation();
  if (!company.name) return null;

  return (
    <footer
      className={`fixed inset-x-0 bottom-0 z-20 flex h-8 items-center justify-center gap-1.5 border-t border-slate-200 bg-white/90 px-4 text-[11px] text-slate-400 backdrop-blur ${sidebarCollapsed ? 'lg:left-17' : 'lg:left-62'}`}
    >
      <span className="shrink-0">{t('footer.developedBy')}</span>
      {company.logo && <img src={company.logo} alt="" className="size-3.5 shrink-0 object-contain" />}
      {company.website ? (
        <a href={company.website} target="_blank" rel="noreferrer" className="truncate font-medium text-slate-500 hover:text-slate-700">
          {company.name}
        </a>
      ) : (
        <span className="truncate font-medium text-slate-500">{company.name}</span>
      )}
    </footer>
  );
}
