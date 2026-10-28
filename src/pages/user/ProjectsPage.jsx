import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectProjectsState } from '../../features/projects/projectsSlice';
import { fetchProjects } from '../../features/projects/projectsThunks';
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
        <Link to={`/projects/${project.id}`} className="font-semibold">
          {project.name}
        </Link>
        <span className="text-slate-500 text-xs block max-w-50 truncate sm:max-w-80">{project.description || 'No description'}</span>
      </div>
    ),
  },
  { key: 'environment', header: 'Environment' },
  { key: 'targets', header: 'Targets', className: 'text-right', render: (project) => project.targets.length },
  { key: 'openFindingCount', header: 'Open findings', className: 'text-right' },
  { key: 'lastScanAt', header: 'Last scan', render: (project) => (project.lastScanAt ? formatRelativeTime(project.lastScanAt) : 'Never') },
  { key: 'status', header: 'Status', render: (project) => <StatusBadge status={project.status} /> },
];

export default function ProjectsPage() {
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
      (includesText(project.name, search) || includesText(project.description, search)),
  );

  return (
    <>
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
      <Card flush>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleProjects.length : undefined}>
          <SearchInput label="Search projects" placeholder="Search by name or description" value={search} onChange={setSearch} />
          <SelectFilter label="Filter by status" allLabel="All statuses" value={statusFilter} onChange={setStatusFilter} options={PROJECT_STATUSES} />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchProjects())}>
          <DataTable columns={COLUMNS} rows={visibleProjects} caption="Projects" emptyMessage="No projects match your filters." />
        </AsyncContent>
      </Card>

      {isCreateOpen && (
        <CreateProjectModal onClose={() => setIsCreateOpen(false)} onCreated={(project) => navigate(`/projects/${project.id}`)} />
      )}
    </>
  );
}
