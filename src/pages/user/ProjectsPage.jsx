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
import { can } from '../../utils/roles';

const COLUMNS = [
  {
    key: 'name',
    header: 'Project',
    render: (project) => (
      <div className="flex min-w-40 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <code className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">{project.code}</code>
          <Link to={`/projects/${project.id}`} className="font-semibold">
            {project.name}
          </Link>
        </span>
        <span className="text-slate-500 text-xs block max-w-50 truncate sm:max-w-80">{project.description || 'No description'}</span>
      </div>
    ),
  },
  { key: 'environment', header: 'Environment' },
  { key: 'targets', header: 'Targets', className: 'text-right', render: (project) => project.targets.length },
  { key: 'openFindingCount', header: 'Open findings', className: 'text-right' },
  { key: 'lastScanAt', header: 'Last scan', render: (project) => (project.lastScanAt ? formatRelativeTime(project.lastScanAt) : 'Never') },
  { key: 'status', header: 'Status', render: (project) => <StatusBadge status={project.status} category="project-statuses" /> },
  // Shows that the whole row opens the project, where its targets are set up.
  { key: 'open', header: '', className: 'w-10 text-right', render: () => <ChevronRight size={16} aria-hidden="true" className="text-slate-400" /> },
];

export default function ProjectsPage() {
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
        title="Projects"
        description="Applications and environments your organization scans."
        actions={
          can(user, 'projects.create') && (
            <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              New project
            </button>
          )
        }
      />
      <Card flush fill>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleProjects.length : undefined}>
          <SearchInput label="Search projects" placeholder="Search by code, name or description" value={search} onChange={setSearch} />
          <SelectFilter
            label="Filter by status"
            allLabel="All statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            options={projectStatuses.options(PROJECT_STATUSES)}
          />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchProjects())}>
          <DataTable
            columns={COLUMNS}
            rows={visibleProjects}
            caption="Projects"
            onRowClick={(project) => navigate(`/projects/${project.id}`)}
            emptyMessage="No projects match your filters."
          />
        </AsyncContent>
      </Card>

      {isCreateOpen && <CreateProjectModal onClose={() => setIsCreateOpen(false)} onCreated={(project) => navigate(`/projects/${project.id}`)} />}
    </div>
  );
}
