import { CircleAlert, CircleDot, Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import { useTranslation } from '../i18n';

const SEVERITY_STYLES = {
  Critical: { icon: OctagonAlert, classes: 'bg-red-100 text-red-800' },
  High: { icon: TriangleAlert, classes: 'bg-orange-100 text-orange-700' },
  Medium: { icon: CircleAlert, classes: 'bg-yellow-100 text-yellow-800' },
  Low: { icon: CircleDot, classes: 'bg-blue-100 text-blue-700' },
  Informational: { icon: Info, classes: 'bg-slate-100 text-slate-600' },
};

export default function SeverityBadge({ severity }) {
  const { t } = useTranslation();
  const { icon: Icon, classes } = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.Informational;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${classes}`}>
      <Icon size={14} aria-hidden="true" />
      {t(`severity.${severity}`)}
    </span>
  );
}
