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
import { useTranslation } from '../../i18n';

const organizationColumns = (t) => [
  {
    key: 'name',
    header: t('common.organization'),
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
    header: t('organizations.admin'),
    render: (organization) =>
      organization.admin ? (
        <div className="flex min-w-48 flex-col gap-0.5">
          <span>{organization.admin.name}</span>
          <span className="text-xs text-slate-500">{organization.admin.email}</span>
          <CopyButton
            value={buildLoginMessage(organization, organization.admin, t)}
            label={t('organizations.copyLoginFor', { name: organization.admin.name })}
            text={t('copy.copyMessage')}
            small
          />
        </div>
      ) : (
        <span className="text-slate-500">—</span>
      ),
  },
  { key: 'memberCount', header: t('organizations.members'), className: 'text-right' },
  { key: 'projectCount', header: t('nav.projects'), className: 'text-right' },
  {
    key: 'status',
    header: t('common.status'),
    render: (organization) => <CategoryStatusBadge category="organization-statuses" value={organization.status} />,
  },
  { key: 'createdAt', header: t('common.created'), render: (organization) => formatDate(organization.createdAt) },
];

export default function OrganizationsPage() {
  const { t } = useTranslation();
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
    <div className="fill-page">
      <PageHeader
        title={t('nav.organizations')}
        description={t('organizations.description')}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            {t('organizations.new')}
          </button>
        }
      />
      <Card flush fill>
        <FilterBar resultCount={items.length > 0 || status === 'succeeded' ? visibleOrganizations.length : undefined}>
          <SearchInput label={t('common.search')} placeholder={t('organizations.searchPlaceholder')} value={search} onChange={setSearch} />
          <SelectFilter
            label={t('common.filterByStatus')}
            allLabel={t('common.allStatuses')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={organizationStatuses.items.map((item) => ({ value: item.id, label: organizationStatuses.nameOf(item.id) }))}
          />
        </FilterBar>
        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchOrganizations())}>
          <DataTable
            columns={organizationColumns(t)}
            rows={visibleOrganizations}
            caption={t('nav.organizations')}
            emptyMessage={items.length ? t('common.noMatches') : t('organizations.empty')}
          />
        </AsyncContent>
      </Card>

      {isCreateOpen && <CreateOrganizationModal onClose={() => setIsCreateOpen(false)} />}
    </div>
  );
}
