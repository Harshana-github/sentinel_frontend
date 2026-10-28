import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/format';
import DataTable from './DataTable';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';

export default function FindingsTable({ findings, showTarget = true, emptyMessage = 'No findings found.' }) {
  const columns = [
    { key: 'severity', header: 'Severity', render: (finding) => <SeverityBadge severity={finding.severity} /> },
    {
      key: 'title',
      header: 'Finding',
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
      header: 'Affected target',
      render: (finding) => (
        <div className="flex min-w-40 flex-col gap-0.5">
          <span>{finding.targetName}</span>
          <span className="text-slate-500 text-xs">{finding.projectName}</span>
        </div>
      ),
    },
    { key: 'scanner', header: 'Scanner', render: (finding) => finding.scannerName },
    { key: 'status', header: 'Status', render: (finding) => <StatusBadge status={finding.status} category="finding-statuses" /> },
    { key: 'discovered', header: 'Discovered', render: (finding) => formatRelativeTime(finding.discoveredAt) },
  ].filter(Boolean);

  return <DataTable columns={columns} rows={findings} caption="Vulnerability findings" emptyMessage={emptyMessage} />;
}
