import { Link } from 'react-router-dom';
import { isActiveScan } from '../features/scans/scansSlice';
import { useMasterList } from '../features/masters/useMasterList';
import { formatRelativeTime } from '../utils/format';
import CancelScanButton from './CancelScanButton';
import DataTable from './DataTable';
import ScanStatus from './ScanStatus';

export default function ScansTable({ scans, showProject = true, showActions = false, emptyMessage = 'No scans found.' }) {
  const targetTypes = useMasterList('target-types');
  const columns = [
    {
      key: 'id',
      header: 'Scan',
      className: 'whitespace-nowrap',
      render: (scan) => (
        <div className="flex flex-col gap-0.5">
          <Link to={`/scans/${scan.id}`} className="font-semibold">
            {scan.id}
          </Link>
          {scan.assessmentId ? (
            <Link to={`/assessments/${scan.assessmentId}`} className="text-[11px] font-normal" title={scan.assessmentName}>
              Part of {scan.assessmentId}
            </Link>
          ) : (
            <span className="text-[11px] text-slate-500">Single scan</span>
          )}
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (scan) => (
        <div className="flex min-w-40 flex-col gap-0.5">
          <span>{scan.targetName}</span>
          <span className="text-slate-500 text-xs">{targetTypes.nameOf(scan.targetType)}</span>
          <span className="text-slate-500 text-xs font-mono block max-w-50 truncate sm:max-w-80" title={scan.targetValue}>
            {scan.targetValue}
          </span>
        </div>
      ),
    },
    showProject && {
      key: 'project',
      header: 'Project',
      render: (scan) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          {scan.projectCode && <code className="text-[11px] text-slate-500">{scan.projectCode}</code>}
          <Link to={`/projects/${scan.projectId}`}>{scan.projectName}</Link>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (scan) => <ScanStatus scan={scan} /> },
    {
      key: 'findings',
      header: 'Findings',
      className: 'text-right',
      render: (scan) => (scan.status === 'Completed' ? scan.findingCount : '—'),
    },
    { key: 'created', header: 'Requested', className: 'whitespace-nowrap', render: (scan) => formatRelativeTime(scan.createdAt) },
    showActions && {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      render: (scan) => (isActiveScan(scan) ? <CancelScanButton scan={scan} small /> : null),
    },
  ].filter(Boolean);

  return <DataTable columns={columns} rows={scans} caption="Scans" emptyMessage={emptyMessage} />;
}
