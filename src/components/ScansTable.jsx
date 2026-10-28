import { Link } from 'react-router-dom';
import { isActiveScan } from '../features/scans/scansSlice';
import { useMasterList } from '../features/masters/useMasterList';
import { formatRelativeTime } from '../utils/format';
import CancelScanButton from './CancelScanButton';
import DataTable from './DataTable';
import ScanStatus from './ScanStatus';
import { useTranslation } from '../i18n';

export default function ScansTable({ scans, showProject = true, showActions = false, emptyMessage }) {
  const { t } = useTranslation();
  const targetTypes = useMasterList('target-types');
  const columns = [
    {
      key: 'id',
      header: t('scans.scan'),
      className: 'whitespace-nowrap',
      render: (scan) => (
        <div className="flex flex-col gap-0.5">
          <Link to={`/scans/${scan.id}`} className="font-semibold">
            {scan.id}
          </Link>
          {scan.assessmentId ? (
            <Link to={`/assessments/${scan.assessmentId}`} className="text-[11px] font-normal" title={scan.assessmentName}>
              {t('scans.partOf', { id: scan.assessmentId })}
            </Link>
          ) : (
            <span className="text-[11px] text-slate-500">{t('scans.singleScan')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'target',
      header: t('scans.target'),
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
      header: t('projects.project'),
      render: (scan) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          {scan.projectCode && <code className="text-[11px] text-slate-500">{scan.projectCode}</code>}
          <Link to={`/projects/${scan.projectId}`}>{scan.projectName}</Link>
        </span>
      ),
    },
    { key: 'status', header: t('common.status'), render: (scan) => <ScanStatus scan={scan} /> },
    {
      key: 'findings',
      header: t('nav.findings'),
      className: 'text-right',
      render: (scan) => (scan.status === 'Completed' ? scan.findingCount : '—'),
    },
    { key: 'created', header: t('scans.requested'), className: 'whitespace-nowrap', render: (scan) => formatRelativeTime(scan.createdAt) },
    showActions && {
      key: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      render: (scan) => (isActiveScan(scan) ? <CancelScanButton scan={scan} small /> : null),
    },
  ].filter(Boolean);

  return <DataTable columns={columns} rows={scans} caption={t('nav.scans')} emptyMessage={emptyMessage ?? t('scans.empty')} />;
}
