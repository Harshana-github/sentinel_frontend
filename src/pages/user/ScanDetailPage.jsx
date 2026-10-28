import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectFindingsState } from '../../features/findings/findingsSlice';
import { fetchFindings } from '../../features/findings/findingsThunks';
import { selectScannersState } from '../../features/scanners/scannersSlice';
import { fetchScannerModules } from '../../features/scanners/scannersThunks';
import { isActiveScan, selectScanById, selectScansState } from '../../features/scans/scansSlice';
import { fetchScans, startScan } from '../../features/scans/scansThunks';
import { showToast } from '../../features/ui/uiSlice';
import AsyncContent from '../../components/AsyncContent';
import CancelScanButton from '../../components/CancelScanButton';
import Card from '../../components/Card';
import DetailList from '../../components/DetailList';
import FindingsTable from '../../components/FindingsTable';
import PageHeader from '../../components/PageHeader';
import ProgressBar from '../../components/ProgressBar';
import SeverityBadge from '../../components/SeverityBadge';
import { EmptyState } from '../../components/StateMessage';
import StatusBadge from '../../components/StatusBadge';
import usePolling from '../../hooks/usePolling';
import { USE_MOCK_DATA } from '../../services/api';
import { useMasterList } from '../../features/masters/useMasterList';
import { SEVERITIES } from '../../utils/constants';
import { formatDateTime, formatDuration } from '../../utils/format';
import { can } from '../../utils/roles';
import Alert from '../../components/Alert';
import { useTranslation } from '../../i18n';

export default function ScanDetailPage() {
  const { t } = useTranslation();
  const targetTypes = useMasterList('target-types');
  const { scanId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const scans = useSelector(selectScansState);
  const scan = useSelector((state) => selectScanById(state, scanId));
  const findings = useSelector(selectFindingsState);
  const scanners = useSelector(selectScannersState);
  const [isRescanning, setIsRescanning] = useState(false);

  useEffect(() => {
    dispatch(fetchScans());
    dispatch(fetchScannerModules());
  }, [dispatch, scanId]);

  // Findings appear when the scan completes, so reload them whenever its status changes.
  useEffect(() => {
    dispatch(fetchFindings());
  }, [dispatch, scanId, scan?.status]);

  const refreshScans = useCallback(() => dispatch(fetchScans({ silent: true })), [dispatch]);
  usePolling(refreshScans, Boolean(scan && isActiveScan(scan)));

  async function handleRescan() {
    if (isRescanning) return;
    setIsRescanning(true);
    try {
      const newScan = await dispatch(
        startScan({ projectId: scan.projectId, targetId: scan.targetId, profile: scan.profile, tools: scan.tools }),
      ).unwrap();
      dispatch(showToast({ message: t('scans.queued', { id: newScan.id }) }));
      navigate(`/scans/${newScan.id}`);
    } catch (error) {
      dispatch(showToast({ type: 'error', message: error.message }));
    } finally {
      setIsRescanning(false);
    }
  }

  const breadcrumbs = [{ label: t('scans.title'), to: '/scans' }, { label: scanId }];

  if (scans.status === 'succeeded' && !scan) {
    return (
      <>
        <PageHeader title={t('scans.notFound')} breadcrumbs={breadcrumbs} />
        <EmptyState title={t('scans.notFoundMessage')} action={<Link to="/scans">{t('scans.backToList')}</Link>} />
      </>
    );
  }

  const scanFindings = findings.items.filter((finding) => finding.scanId === scanId);
  const toolNames = scan?.tools.map((tool) => scanners.items.find((module) => module.id === tool)?.name ?? tool).join(', ');

  return (
    <>
      <PageHeader
        title={scan ? t('scans.scanTitle', { id: scan.id }) : t('scans.scan')}
        description={scan && `${scan.targetName} · ${scan.projectName}`}
        breadcrumbs={breadcrumbs}
        actions={
          scan &&
          (isActiveScan(scan) ? (
            <CancelScanButton scan={scan} />
          ) : (
            can(user, 'scans.start') && (
              <button type="button" className="btn btn-secondary" onClick={handleRescan} disabled={isRescanning}>
                <RotateCw size={16} aria-hidden="true" />
                {isRescanning ? t('scans.queuing') : t('scans.runAgain')}
              </button>
            )
          ))
        }
      />

      <AsyncContent status={scans.status} error={scans.error} hasData={Boolean(scan)} onRetry={() => dispatch(fetchScans())}>
        {scan && (
          <div className="flex flex-col gap-5">
            <Card title={t('scans.progress')}>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <StatusBadge status={scan.status} category="scan-statuses" />
                  <span className="text-xl font-bold">{scan.progress}%</span>
                </div>
                <ProgressBar value={scan.progress} label={t('scans.progressOf', { id: scan.id })} className="h-2.5" />
                {scan.status === 'Queued' && <p className="text-slate-500">{t('scans.waitingForWorker')}</p>}
                {scan.status === 'Running' && (
                  <p className="text-slate-500">
                    {t('scans.runningTools', { tools: toolNames })} {USE_MOCK_DATA && t('scans.simulated')}
                  </p>
                )}
                {scan.status === 'Failed' && <Alert tone="error">{scan.errorMessage}</Alert>}
                {scan.status === 'Cancelled' && <Alert>{t('scans.cancelledNotice')}</Alert>}
              </div>
            </Card>

            <Card title={t('common.details')}>
              <DetailList
                items={[
                  { label: t('projects.project'), value: <Link to={`/projects/${scan.projectId}`}>{scan.projectName}</Link> },
                  { label: t('common.organization'), value: scan.organizationName },
                  { label: t('scans.target'), value: scan.targetName },
                  { label: t('targets.address'), value: <span className="font-mono">{scan.targetValue}</span> },
                  { label: t('targets.type'), value: targetTypes.nameOf(scan.targetType) },
                  {
                    label: t('scans.startedAs'),
                    value: scan.assessmentId ? (
                      <Link to={`/assessments/${scan.assessmentId}`}>
                        {t('scans.partOf', { id: scan.assessmentId })} · {scan.assessmentName}
                      </Link>
                    ) : (
                      t('scans.singleScan')
                    ),
                  },
                  { label: t('scanProfiles.legend'), value: t(`scanProfiles.${scan.profile}.name`) },
                  { label: t('scanOptions.tools'), value: toolNames },
                  { label: t('scans.requestedBy'), value: scan.initiatedBy },
                  { label: t('scans.requested'), value: formatDateTime(scan.createdAt) },
                  { label: t('scans.started'), value: formatDateTime(scan.startedAt) },
                  { label: t('scans.finished'), value: formatDateTime(scan.finishedAt) },
                  { label: t('scans.duration'), value: formatDuration(scan.startedAt, scan.finishedAt) },
                ]}
              />
            </Card>

            <Card title={t('findings.titleCount', { count: scanFindings.length })} flush>
              {scan.status === 'Completed' && (
                <ul className="flex flex-wrap gap-3.5 border-b border-slate-200 px-5 py-4" aria-label={t('dashboard.openBySeverity')}>
                  {SEVERITIES.map((severity) => (
                    <li key={severity} className="flex items-center gap-1.5">
                      <SeverityBadge severity={severity} /> <strong>{scanFindings.filter((finding) => finding.severity === severity).length}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <AsyncContent
                status={findings.status}
                error={findings.error}
                hasData={findings.items.length > 0}
                onRetry={() => dispatch(fetchFindings())}
              >
                <FindingsTable
                  findings={scanFindings}
                  showTarget={false}
                  emptyMessage={scan.status === 'Completed' ? t('scans.noIssues') : t('scans.findingsLater')}
                />
              </AsyncContent>
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
