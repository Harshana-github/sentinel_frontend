import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import { useTranslation } from '../i18n';

export default function ScanStatus({ scan }) {
  const { t } = useTranslation();
  if (scan.status !== 'Running') return <StatusBadge status={scan.status} category="scan-statuses" />;
  return (
    <div className="flex min-w-48 items-center gap-2">
      <StatusBadge status={scan.status} category="scan-statuses" />
      <ProgressBar value={scan.progress} label={t('scans.progressOf', { id: scan.id })} className="h-2 w-18" />
      <span className="text-slate-500">{scan.progress}%</span>
    </div>
  );
}
