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

export default function ScanDetailPage() {
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
      dispatch(showToast({ message: `Scan ${newScan.id} was queued.` }));
      navigate(`/scans/${newScan.id}`);
    } catch (error) {
      dispatch(showToast({ type: 'error', message: error.message }));
    } finally {
      setIsRescanning(false);
    }
  }

  const breadcrumbs = [{ label: 'Scans', to: '/scans' }, { label: scanId }];

  if (scans.status === 'succeeded' && !scan) {
    return (
      <>
        <PageHeader title="Scan not found" breadcrumbs={breadcrumbs} />
        <EmptyState title="This scan does not exist." action={<Link to="/scans">Back to scans</Link>} />
      </>
    );
  }

  const scanFindings = findings.items.filter((finding) => finding.scanId === scanId);
  const toolNames = scan?.tools.map((tool) => scanners.items.find((module) => module.id === tool)?.name ?? tool).join(', ');

  return (
    <>
      <PageHeader
        title={scan ? `Scan ${scan.id}` : 'Scan'}
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
                {isRescanning ? 'Queuing…' : 'Run again'}
              </button>
            )
          ))
        }
      />

      <AsyncContent status={scans.status} error={scans.error} hasData={Boolean(scan)} onRetry={() => dispatch(fetchScans())}>
        {scan && (
          <div className="flex flex-col gap-5">
            <Card title="Progress">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <StatusBadge status={scan.status} />
                  <span className="text-xl font-bold">{scan.progress}%</span>
                </div>
                <ProgressBar value={scan.progress} label={`Scan ${scan.id} progress`} className="h-2.5" />
                {scan.status === 'Queued' && <p className="text-slate-500">Waiting for a free scan worker…</p>}
                {scan.status === 'Running' && (
                  <p className="text-slate-500">
                    Running {toolNames}. {USE_MOCK_DATA && 'Progress is simulated in demo mode.'}
                  </p>
                )}
                {scan.status === 'Failed' && (
                  <Alert tone="error">
                    {scan.errorMessage}
                  </Alert>
                )}
                {scan.status === 'Cancelled' && <Alert>This scan was cancelled before it finished.</Alert>}
              </div>
            </Card>

            <Card title="Details">
              <DetailList
                items={[
                  { label: 'Project', value: <Link to={`/projects/${scan.projectId}`}>{scan.projectName}</Link> },
                  { label: 'Organization', value: scan.organizationName },
                  { label: 'Target', value: scan.targetName },
                  { label: 'Address', value: <span className="font-mono">{scan.targetValue}</span> },
                  { label: 'Target type', value: targetTypes.nameOf(scan.targetType) },
                  { label: 'Profile', value: scan.profile },
                  { label: 'Scanner modules', value: toolNames },
                  { label: 'Requested by', value: scan.initiatedBy },
                  { label: 'Requested', value: formatDateTime(scan.createdAt) },
                  { label: 'Started', value: formatDateTime(scan.startedAt) },
                  { label: 'Finished', value: formatDateTime(scan.finishedAt) },
                  { label: 'Duration', value: formatDuration(scan.startedAt, scan.finishedAt) },
                ]}
              />
            </Card>

            <Card title={`Findings (${scanFindings.length})`} flush>
              {scan.status === 'Completed' && (
                <ul className="flex flex-wrap gap-3.5 border-b border-slate-200 px-5 py-4" aria-label="Findings by severity">
                  {SEVERITIES.map((severity) => (
                    <li key={severity} className="flex items-center gap-1.5">
                      <SeverityBadge severity={severity} /> <strong>{scanFindings.filter((finding) => finding.severity === severity).length}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <AsyncContent status={findings.status} error={findings.error} hasData={findings.items.length > 0} onRetry={() => dispatch(fetchFindings())}>
                <FindingsTable
                  findings={scanFindings}
                  showTarget={false}
                  emptyMessage={scan.status === 'Completed' ? 'This scan found no issues.' : 'Findings appear here when the scan completes.'}
                />
              </AsyncContent>
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
