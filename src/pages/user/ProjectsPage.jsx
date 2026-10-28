import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectProjectsState } from '../../features/projects/projectsSlice';
import { fetchProjects } from '../../features/projects/projectsThunks';
import { useStatusList } from '../../features/masters/useStatusList';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import CreateProjectModal from '../../components/CreateProjectModal';
import DataTable from '../../components/DataTable';
import { FilterBar, SearchInput, SelectFilter } from '../../components/Filters';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { PROJECT_STATUSES } from '../../utils/constants';
import { formatRelativeTime, includesText } from '../../utils/format';
import { useTranslation } from '../../i18n';
import { can } from '../../utils/roles';

const projectColumns = (t) => [
  {
    key: 'name',
    header: t('projects.project'),
    render: (project) => (
      <div className="flex min-w-40 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <code className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">{project.code}</code>
          <Link to={`/projects/${project.id}`} className="font-semibold">
            {project.name}
          </Link>
        </span>
        <span className="text-slate-500 text-xs block max-w-50 truncate sm:max-w-80">{project.description || t('common.noDescription')}</span>
      </div>
    ),
  },
  { key: 'environment', header: t('projects.environment'), render: (project) => t(`environments.${project.environment}`) },
  { key: 'targets', header: t('projects.targets'), className: 'text-right', render: (project) => project.targets.length },
  { key: 'openFindingCount', header: t('projects.openFindings'), className: 'text-right' },
  {
    key: 'lastScanAt',
    header: t('projects.lastScan'),
    render: (project) => (project.lastScanAt ? formatRelativeTime(project.lastScanAt) : t('common.never')),
  },
  { key: 'status', header: t('common.status'), render: (project) => <StatusBadge status={project.status} category="project-statuses" /> },
  // Shows that the whole row opens the project, where its targets are set up.
  { key: 'open', header: '', className: 'w-10 text-right', render: () => <ChevronRight size={16} aria-hidden="true" className="text-slate-400" /> },
];

export default function ProjectsPage() {
  const { t } = useTranslation();
  const projectStatuses = useStatusList('project-statuses');
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { items, status, error } = useSelector(selectProjectsState);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const visibleProjects = items.filter(
    (project) =>
      (!statusFilter || project.status === statusFilter) &&
      (includesText(project.name, search) || includesText(project.code, search) || includesText(project.description, search)),
  );

  return (
    <div className="fill-page">
      <PageHeader
        title={t('projects.title')}
        description={t('projects.description')}
        actions={
          can(user, 'projects.create') && (
            <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              {t('projects.new')}
            </button>
          )
        }
      />
      <Card flush fill>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleProjects.length : undefined}>
          <SearchInput label={t('common.search')} placeholder={t('projects.searchPlaceholder')} value={search} onChange={setSearch} />
          <SelectFilter
            label={t('common.filterByStatus')}
            allLabel={t('common.allStatuses')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={projectStatuses.options(PROJECT_STATUSES)}
          />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchProjects())}>
          <DataTable
            columns={projectColumns(t)}
            rows={visibleProjects}
            caption={t('projects.title')}
            onRowClick={(project) => navigate(`/projects/${project.id}`)}
            emptyMessage={items.length ? t('common.noMatches') : t('projects.empty')}
          />
        </AsyncContent>
      </Card>

      {isCreateOpen && <CreateProjectModal onClose={() => setIsCreateOpen(false)} onCreated={(project) => navigate(`/projects/${project.id}`)} />}
    </div>
  );
}
