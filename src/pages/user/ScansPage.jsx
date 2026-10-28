import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, Play, Zap } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { isActiveScan, selectScansState } from '../../features/scans/scansSlice';
import { fetchScans } from '../../features/scans/scansThunks';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import { FilterBar, SearchInput, SelectFilter } from '../../components/Filters';
import PageHeader from '../../components/PageHeader';
import ScansTable from '../../components/ScansTable';
import StartScanModal from '../../components/StartScanModal';
import usePolling from '../../hooks/usePolling';
import { useMasterList } from '../../features/masters/useMasterList';
import { useStatusList } from '../../features/masters/useStatusList';
import { SCAN_STATUSES } from '../../utils/constants';
import { includesText } from '../../utils/format';
import { can } from '../../utils/roles';

export default function ScansPage() {
  const targetTypes = useMasterList('target-types');
  const scanStatuses = useStatusList('scan-statuses');
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, status, error } = useSelector(selectScansState);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [typeFilter, setTypeFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [isStartScanOpen, setIsStartScanOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchScans());
  }, [dispatch]);

  const refreshScans = useCallback(() => dispatch(fetchScans({ silent: true })), [dispatch]);
  usePolling(refreshScans, items.some(isActiveScan));

  const visibleScans = items.filter(
    (scan) =>
      (!statusFilter || scan.status === statusFilter) &&
      (!typeFilter || scan.targetType === typeFilter) &&
      (!kindFilter || (kindFilter === 'assessment' ? Boolean(scan.assessmentId) : !scan.assessmentId)) &&
      (includesText(scan.id, search) ||
        includesText(scan.targetName, search) ||
        includesText(scan.targetValue, search) ||
        includesText(scan.projectName, search) ||
        includesText(scan.assessmentId, search)),
  );

  return (
    <div className="fill-page">
      <PageHeader
        title="Scans"
        description="Scan history and live progress. Running scans refresh automatically."
        actions={
          can(user, 'scans.start') && (
            <>
              <Link to="/assessments/new" className="btn btn-secondary hover:no-underline">
                <Layers size={16} aria-hidden="true" />
                New assessment
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => setIsStartScanOpen(true)}>
                <Play size={16} aria-hidden="true" />
                Single scan
              </button>
              <Link to="/quick-scan" className="btn btn-primary hover:no-underline">
                <Zap size={16} aria-hidden="true" />
                Quick scan
              </Link>
            </>
          )
        }
      />
      <Card flush fill>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleScans.length : undefined}>
          <SearchInput label="Search scans" placeholder="Search by scan ID, target or project" value={search} onChange={setSearch} />
          <SelectFilter
            label="Filter by status"
            allLabel="All statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            options={scanStatuses.options(SCAN_STATUSES)}
          />
          <SelectFilter
            label="Filter by target type"
            allLabel="All target types"
            value={typeFilter}
            onChange={setTypeFilter}
            options={targetTypes.items.map((type) => ({ value: type.id, label: type.name }))}
          />
          <SelectFilter
            label="Filter by kind"
            allLabel="Single scans and assessments"
            value={kindFilter}
            onChange={setKindFilter}
            options={[
              { value: 'single', label: 'Single scans' },
              { value: 'assessment', label: 'Assessment jobs' },
            ]}
          />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchScans())}>
          <ScansTable scans={visibleScans} showActions emptyMessage="No scans match your filters." />
        </AsyncContent>
      </Card>

      {isStartScanOpen && <StartScanModal onClose={() => setIsStartScanOpen(false)} onStarted={(scan) => navigate(`/scans/${scan.id}`)} />}
    </div>
  );
}
