import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { selectFindingsState } from '../../features/findings/findingsSlice';
import { fetchFindings } from '../../features/findings/findingsThunks';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import { FilterBar, SearchInput, SelectFilter } from '../../components/Filters';
import FindingsTable from '../../components/FindingsTable';
import PageHeader from '../../components/PageHeader';
import { FINDING_STATUSES, SEVERITIES } from '../../utils/constants';
import { includesText } from '../../utils/format';

// Most severe first, then newest first.
function bySeverityThenDate(a, b) {
  return SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || b.discoveredAt.localeCompare(a.discoveredAt);
}

export default function FindingsPage() {
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
    <>
      <PageHeader title="Vulnerability findings" description="Issues reported by scanner modules across all projects." />
      <Card flush>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleFindings.length : undefined}>
          <SearchInput label="Search findings" placeholder="Search by title, CVE, ID, target or project" value={search} onChange={setSearch} />
          <SelectFilter label="Filter by severity" allLabel="All severities" value={severityFilter} onChange={setSeverityFilter} options={SEVERITIES} />
          <SelectFilter label="Filter by status" allLabel="All statuses" value={statusFilter} onChange={setStatusFilter} options={FINDING_STATUSES} />
          <SelectFilter label="Filter by scanner" allLabel="All scanners" value={scannerFilter} onChange={setScannerFilter} options={scannerOptions} />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchFindings())}>
          <FindingsTable findings={visibleFindings} emptyMessage="No findings match your filters." />
        </AsyncContent>
      </Card>
    </>
  );
}
