import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/format';
import DataTable from './DataTable';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import { useTranslation } from '../i18n';

export default function FindingsTable({ findings, showTarget = true, emptyMessage }) {
  const { t } = useTranslation();
  const columns = [
    { key: 'severity', header: t('findings.severity'), render: (finding) => <SeverityBadge severity={finding.severity} /> },
    {
      key: 'title',
      header: t('findings.finding'),
      render: (finding) => (
        <div className="flex min-w-40 flex-col gap-0.5">
          <Link to={`/findings/${finding.id}`} className="font-semibold">
            {finding.title}
          </Link>
          <span className="text-slate-500 text-xs">
            {finding.id}
            {finding.cve && ` · ${finding.cve}`}
          </span>
        </div>
      ),
    },
    showTarget && {
      key: 'target',
      header: t('findings.affectedTarget'),
      render: (finding) => (
        <div className="flex min-w-40 flex-col gap-0.5">
          <span>{finding.targetName}</span>
          <span className="text-slate-500 text-xs">{finding.projectName}</span>
        </div>
      ),
    },
    { key: 'scanner', header: t('findings.scanner'), render: (finding) => finding.scannerName },
    { key: 'status', header: t('common.status'), render: (finding) => <StatusBadge status={finding.status} category="finding-statuses" /> },
    { key: 'discovered', header: t('findings.discovered'), render: (finding) => formatRelativeTime(finding.discoveredAt) },
  ].filter(Boolean);

  return <DataTable columns={columns} rows={findings} caption={t('nav.findings')} emptyMessage={emptyMessage ?? t('findings.empty')} />;
}
