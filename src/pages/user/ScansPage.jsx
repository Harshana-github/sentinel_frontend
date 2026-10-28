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
import { useTranslation } from '../../i18n';
import { can } from '../../utils/roles';

export default function ScansPage() {
  const { t } = useTranslation();
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
        title={t('scans.title')}
        description={t('scans.description')}
        actions={
          can(user, 'scans.start') && (
            <>
              <Link to="/assessments/new" className="btn btn-secondary hover:no-underline">
                <Layers size={16} aria-hidden="true" />
                {t('assessments.new')}
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => setIsStartScanOpen(true)}>
                <Play size={16} aria-hidden="true" />
                {t('scans.singleScan')}
              </button>
              <Link to="/quick-scan" className="btn btn-primary hover:no-underline">
                <Zap size={16} aria-hidden="true" />
                {t('nav.quickScan')}
              </Link>
            </>
          )
        }
      />
      <Card flush fill>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleScans.length : undefined}>
          <SearchInput label={t('common.search')} placeholder={t('scans.searchPlaceholder')} value={search} onChange={setSearch} />
          <SelectFilter
            label={t('common.filterByStatus')}
            allLabel={t('common.allStatuses')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={scanStatuses.options(SCAN_STATUSES)}
          />
          <SelectFilter
            label={t('targets.type')}
            allLabel={t('scans.allTargetTypes')}
            value={typeFilter}
            onChange={setTypeFilter}
            options={targetTypes.items.map((type) => ({ value: type.id, label: targetTypes.nameOf(type.id) }))}
          />
          <SelectFilter
            label={t('scans.kind')}
            allLabel={t('scans.allKinds')}
            value={kindFilter}
            onChange={setKindFilter}
            options={[
              { value: 'single', label: t('scans.kindSingle') },
              { value: 'assessment', label: t('scans.kindAssessment') },
            ]}
          />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchScans())}>
          <ScansTable scans={visibleScans} showActions emptyMessage={items.length ? t('common.noMatches') : t('scans.empty')} />
        </AsyncContent>
      </Card>

      {isStartScanOpen && <StartScanModal onClose={() => setIsStartScanOpen(false)} onStarted={(scan) => navigate(`/scans/${scan.id}`)} />}
    </div>
  );
}
