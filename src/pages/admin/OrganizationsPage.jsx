import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectOrganizationsState } from '../../features/organizations/organizationsSlice';
import { fetchOrganizations } from '../../features/organizations/organizationsThunks';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import CopyButton from '../../components/CopyButton';
import CreateOrganizationModal from '../../components/CreateOrganizationModal';
import DataTable from '../../components/DataTable';
import { FilterBar, SearchInput, SelectFilter } from '../../components/Filters';
import PageHeader from '../../components/PageHeader';
import { CategoryStatusBadge } from '../../components/StatusBadge';
import { useMasterList } from '../../features/masters/useMasterList';
import { buildLoginMessage } from '../../utils/loginMessage';
import { formatDate, includesText } from '../../utils/format';

const COLUMNS = [
  {
    key: 'name',
    header: 'Organization',
    render: (organization) => (
      <div className="flex min-w-40 flex-col gap-0.5">
        <Link to={`/admin/organizations/${organization.id}`} className="font-semibold">
          {organization.name}
        </Link>
        <code className="text-xs text-slate-500">{organization.slug}</code>
      </div>
    ),
  },
  {
    key: 'admin',
    header: 'Organization admin',
    render: (organization) =>
      organization.admin ? (
        <div className="flex min-w-48 flex-col gap-0.5">
          <span>{organization.admin.name}</span>
          <span className="text-xs text-slate-500">{organization.admin.email}</span>
          <CopyButton
            value={buildLoginMessage(organization, organization.admin)}
            label={`Copy login message for ${organization.admin.name}`}
            text="Copy message"
            small
          />
        </div>
      ) : (
        <span className="text-slate-500">—</span>
      ),
  },
  { key: 'memberCount', header: 'Members', className: 'text-right' },
  { key: 'projectCount', header: 'Projects', className: 'text-right' },
  { key: 'status', header: 'Status', render: (organization) => <CategoryStatusBadge category="organization-statuses" value={organization.status} /> },
  { key: 'createdAt', header: 'Created', render: (organization) => formatDate(organization.createdAt) },
];

export default function OrganizationsPage() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector(selectOrganizationsState);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const organizationStatuses = useMasterList('organization-statuses');

  useEffect(() => {
    dispatch(fetchOrganizations());
  }, [dispatch]);

  const visibleOrganizations = items.filter(
    (organization) =>
      (!statusFilter || organization.status === statusFilter) &&
      (includesText(organization.name, search) ||
        includesText(organization.slug, search) ||
        includesText(organization.contactEmail, search) ||
        includesText(organization.admin?.name, search) ||
        includesText(organization.admin?.email, search)),
  );

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Customer organizations using Sentinel."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            New organization
          </button>
        }
      />
      <Card flush>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleOrganizations.length : undefined}>
          <SearchInput label="Search organizations" placeholder="Search by name, admin or email" value={search} onChange={setSearch} />
          <SelectFilter label="Filter by status" allLabel="All statuses" value={statusFilter} onChange={setStatusFilter} options={organizationStatuses.items.map((item) => ({ value: item.id, label: item.name }))} />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchOrganizations())}>
          <DataTable columns={COLUMNS} rows={visibleOrganizations} caption="Organizations" emptyMessage="No organizations match your search." />
        </AsyncContent>
      </Card>

      {isCreateOpen && <CreateOrganizationModal onClose={() => setIsCreateOpen(false)} />}
    </>
  );
}
