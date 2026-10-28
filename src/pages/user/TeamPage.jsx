import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectMembersOf } from '../../features/organizations/organizationsSlice';
import { fetchOrganizationMembers } from '../../features/organizations/organizationsThunks';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { CategoryStatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/StateMessage';
import { can } from '../../utils/roles';
import { formatRelativeTime } from '../../utils/format';

const COLUMNS = [
  {
    key: 'name',
    header: 'Name',
    render: (member) => (
      <div className="flex min-w-40 flex-col gap-0.5">
        <span className="font-semibold">{member.name}</span>
        <span className="text-slate-500 text-xs">{member.email}</span>
      </div>
    ),
  },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status', render: (member) => <CategoryStatusBadge category="user-statuses" value={member.status} /> },
  { key: 'lastActiveAt', header: 'Last active', render: (member) => (member.lastActiveAt ? formatRelativeTime(member.lastActiveAt) : 'Never') },
];

export default function TeamPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const members = useSelector((state) => selectMembersOf(state, user.organizationId));

  const canView = can(user, 'users.read');

  useEffect(() => {
    if (canView) dispatch(fetchOrganizationMembers(user.organizationId));
  }, [dispatch, user.organizationId, canView]);

  if (!canView) {
    return (
      <>
        <PageHeader title="Users" />
        <EmptyState title="You do not have permission to view users." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Users" description={`People in ${user.organizationName} who can use Sentinel.`} />
      <Card title={`Members (${members.items.length})`} flush>
        <AsyncContent
          status={members.status}
          error={members.error}
          hasData={members.items.length > 0}
          onRetry={() => dispatch(fetchOrganizationMembers(user.organizationId))}
        >
          <DataTable columns={COLUMNS} rows={members.items} caption="Team members" emptyMessage="No members yet." />
        </AsyncContent>
      </Card>
    </>
  );
}
