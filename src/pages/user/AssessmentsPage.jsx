import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { isActiveAssessment, selectAssessmentsState } from '../../features/assessments/assessmentsSlice';
import { fetchAssessments } from '../../features/assessments/assessmentsThunks';
import { useStatusList } from '../../features/masters/useStatusList';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import { FilterBar, SearchInput, SelectFilter } from '../../components/Filters';
import PageHeader from '../../components/PageHeader';
import ProgressBar from '../../components/ProgressBar';
import SeverityBadge from '../../components/SeverityBadge';
import StatusBadge from '../../components/StatusBadge';
import usePolling from '../../hooks/usePolling';
import { ASSESSMENT_PROFILES, ASSESSMENT_STATUSES, SEVERITIES } from '../../utils/constants';
import { formatRelativeTime, includesText } from '../../utils/format';
import { useTranslation } from '../../i18n';
import { can } from '../../utils/roles';

export function AssessmentStatus({ assessment }) {
  const { t } = useTranslation();
  if (!isActiveAssessment(assessment)) return <StatusBadge status={assessment.status} category="assessment-statuses" />;
  return (
    <div className="flex min-w-44 items-center gap-2">
      <StatusBadge status={assessment.status} category="assessment-statuses" />
      <ProgressBar value={assessment.progress} label={t('scans.progressOf', { id: assessment.id })} className="h-2 w-16" />
      <span className="text-slate-500">{assessment.progress}%</span>
    </div>
  );
}

// The most severe non-zero counts, e.g. "Critical 1 · High 3".
function FindingSummary({ assessment }) {
  const { t } = useTranslation();
  if (assessment.findingCount === 0) return <span className="text-slate-500">{t('common.none')}</span>;
  const top = SEVERITIES.filter((severity) => assessment.severityCounts[severity]).slice(0, 2);
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <strong>{assessment.findingCount}</strong>
      {top.map((severity) => (
        <span key={severity} className="flex items-center gap-1">
          <SeverityBadge severity={severity} />
          <span className="text-xs text-slate-500">{assessment.severityCounts[severity]}</span>
        </span>
      ))}
    </span>
  );
}

const assessmentColumns = (t) => [
  {
    key: 'name',
    header: t('assessments.assessment'),
    render: (assessment) => (
      <div className="flex min-w-48 flex-col gap-0.5">
        <Link to={`/assessments/${assessment.id}`} className="font-semibold">
          {assessment.name}
        </Link>
        <span className="text-xs text-slate-500">
          {assessment.id} · {t(`assessmentProfiles.${assessment.profile}.name`)}
        </span>
      </div>
    ),
  },
  {
    key: 'project',
    header: t('projects.project'),
    render: (assessment) => (
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <code className="text-[11px] text-slate-500">{assessment.projectCode}</code>
        <Link to={`/projects/${assessment.projectId}`}>{assessment.projectName}</Link>
      </span>
    ),
  },
  { key: 'status', header: t('common.status'), render: (assessment) => <AssessmentStatus assessment={assessment} /> },
  {
    key: 'jobs',
    header: t('assessments.jobs'),
    className: 'text-right',
    render: (assessment) => (
      <span className="whitespace-nowrap">
        {assessment.finishedJobCount}/{assessment.jobCount}
      </span>
    ),
  },
  { key: 'findings', header: t('nav.findings'), render: (assessment) => <FindingSummary assessment={assessment} /> },
  {
    key: 'createdAt',
    header: t('scans.started'),
    render: (assessment) => <span className="whitespace-nowrap">{formatRelativeTime(assessment.createdAt)}</span>,
  },
];

export default function AssessmentsPage() {
  const { t } = useTranslation();
  const assessmentStatuses = useStatusList('assessment-statuses');
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { items, status, error } = useSelector(selectAssessmentsState);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [profileFilter, setProfileFilter] = useState('');

  useEffect(() => {
    dispatch(fetchAssessments());
  }, [dispatch]);

  const refresh = useCallback(() => dispatch(fetchAssessments({ silent: true })), [dispatch]);
  usePolling(refresh, items.some(isActiveAssessment));

  const visible = items.filter(
    (assessment) =>
      (!statusFilter || assessment.status === statusFilter) &&
      (!profileFilter || assessment.profile === profileFilter) &&
      (includesText(assessment.name, search) ||
        includesText(assessment.id, search) ||
        includesText(assessment.projectName, search) ||
        includesText(assessment.projectCode, search)),
  );

  return (
    <div className="fill-page">
      <PageHeader
        title={t('assessments.title')}
        description={t('assessments.description')}
        actions={
          can(user, 'scans.start') && (
            <Link to="/assessments/new" className="btn btn-primary hover:no-underline">
              <Plus size={16} aria-hidden="true" />
              {t('assessments.new')}
            </Link>
          )
        }
      />
      <Card flush fill>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visible.length : undefined}>
          <SearchInput label={t('common.search')} placeholder={t('assessments.searchPlaceholder')} value={search} onChange={setSearch} />
          <SelectFilter
            label={t('common.filterByStatus')}
            allLabel={t('common.allStatuses')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={assessmentStatuses.options(ASSESSMENT_STATUSES)}
          />
          <SelectFilter
            label={t('assessments.profile')}
            allLabel={t('assessments.allProfiles')}
            value={profileFilter}
            onChange={setProfileFilter}
            options={ASSESSMENT_PROFILES.map((profile) => ({ value: profile.key, label: t(`assessmentProfiles.${profile.key}.name`) }))}
          />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0 || status === 'succeeded'} onRetry={() => dispatch(fetchAssessments())}>
          <DataTable
            columns={assessmentColumns(t)}
            rows={visible}
            caption={t('assessments.title')}
            emptyMessage={items.length ? t('common.noMatches') : t('assessments.empty')}
          />
        </AsyncContent>
      </Card>
    </div>
  );
}
