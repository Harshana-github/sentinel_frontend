import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { selectFindingsState } from '../../features/findings/findingsSlice';
import { fetchFindings } from '../../features/findings/findingsThunks';
import { useStatusList } from '../../features/masters/useStatusList';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import { FilterBar, SearchInput, SelectFilter } from '../../components/Filters';
import FindingsTable from '../../components/FindingsTable';
import PageHeader from '../../components/PageHeader';
import { FINDING_STATUSES, SEVERITIES } from '../../utils/constants';
import { includesText } from '../../utils/format';
import { useTranslation } from '../../i18n';

// Most severe first, then newest first.
function bySeverityThenDate(a, b) {
  return SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || b.discoveredAt.localeCompare(a.discoveredAt);
}

export default function FindingsPage() {
  const { t } = useTranslation();
  const findingStatuses = useStatusList('finding-statuses');
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { items, status, error } = useSelector(selectFindingsState);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const [scannerFilter, setScannerFilter] = useState('');

  useEffect(() => {
    dispatch(fetchFindings());
  }, [dispatch]);

  const scannerOptions = [...new Set(items.map((finding) => finding.scannerName))].sort();

  const visibleFindings = items
    .filter(
      (finding) =>
        (!severityFilter || finding.severity === severityFilter) &&
        (!statusFilter || finding.status === statusFilter) &&
        (!scannerFilter || finding.scannerName === scannerFilter) &&
        (includesText(finding.title, search) ||
          includesText(finding.id, search) ||
          includesText(finding.cve, search) ||
          includesText(finding.targetName, search) ||
          includesText(finding.targetValue, search) ||
          includesText(finding.projectName, search)),
    )
    .sort(bySeverityThenDate);

  return (
    <div className="fill-page">
      <PageHeader title={t('findings.title')} description={t('findings.description')} />
      <Card flush fill>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleFindings.length : undefined}>
          <SearchInput label={t('common.search')} placeholder={t('findings.searchPlaceholder')} value={search} onChange={setSearch} />
          <SelectFilter
            label={t('findings.severity')}
            allLabel={t('findings.allSeverities')}
            value={severityFilter}
            onChange={setSeverityFilter}
            options={SEVERITIES.map((severity) => ({ value: severity, label: t(`severity.${severity}`) }))}
          />
          <SelectFilter
            label={t('common.filterByStatus')}
            allLabel={t('common.allStatuses')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={findingStatuses.options(FINDING_STATUSES)}
          />
          <SelectFilter
            label={t('findings.scanner')}
            allLabel={t('findings.allScanners')}
            value={scannerFilter}
            onChange={setScannerFilter}
            options={scannerOptions}
          />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchFindings())}>
          <FindingsTable findings={visibleFindings} emptyMessage={items.length ? t('common.noMatches') : t('findings.empty')} />
        </AsyncContent>
      </Card>
    </div>
  );
}
