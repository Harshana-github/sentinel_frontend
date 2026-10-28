import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectMembersOf } from '../../features/organizations/organizationsSlice';
import { deleteMember, fetchOrganizationMembers } from '../../features/organizations/organizationsThunks';
import { showToast } from '../../features/ui/uiSlice';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import MemberFormModal from '../../components/MemberFormModal';
import PageHeader from '../../components/PageHeader';
import { CategoryStatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/StateMessage';
import { can } from '../../utils/roles';
import { formatRelativeTime } from '../../utils/format';

const BASE_COLUMNS = [
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
  {
    key: 'role',
    header: 'Role',
    render: (member) => <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-slate-700">{member.roleName}</span>,
  },
  { key: 'status', header: 'Status', render: (member) => <CategoryStatusBadge category="user-statuses" value={member.status} /> },
  { key: 'lastActiveAt', header: 'Last active', render: (member) => (member.lastActiveAt ? formatRelativeTime(member.lastActiveAt) : 'Never') },
];

export default function TeamPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const members = useSelector((state) => selectMembersOf(state, user.organizationId));

  const canView = can(user, 'users.read');
  // undefined = closed, null = adding, a member = editing.
  const [editing, setEditing] = useState();
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (canView) dispatch(fetchOrganizationMembers(user.organizationId));
  }, [dispatch, user.organizationId, canView]);

  const canEdit = can(user, 'users.update');
  const canDelete = can(user, 'users.delete');

  async function handleDelete(member) {
    if (!window.confirm(`Delete ${member.name}? They will no longer be able to sign in. This cannot be undone.`)) return;
    setDeletingId(member.id);
    try {
      await dispatch(deleteMember(member.id)).unwrap();
      dispatch(showToast({ message: `${member.name} was deleted.` }));
    } catch (deleteError) {
      dispatch(showToast({ type: 'error', message: deleteError.message }));
      setDeletingId(null);
    }
  }

  const columns =
    canEdit || canDelete
      ? [
          ...BASE_COLUMNS,
          {
            key: 'actions',
            header: 'Actions',
            className: 'w-24 text-right',
            render: (member) => {
              const isSelf = member.id === user.id;
              return (
                <div className="flex justify-end gap-1">
                  {canEdit && (
                    <button type="button" className="icon-btn" aria-label={`Edit ${member.name}`} title="Edit name and role" onClick={() => setEditing(member)}>
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className="icon-btn hover:text-red-700"
                      aria-label={`Delete ${member.name}`}
                      title={isSelf ? 'You cannot delete your own account' : 'Delete user'}
                      disabled={isSelf || deletingId === member.id}
                      onClick={() => handleDelete(member)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            },
          },
        ]
      : BASE_COLUMNS;

  if (!canView) {
    return (
      <>
        <PageHeader title="Users" />
        <EmptyState title="You do not have permission to view users." />
      </>
    );
  }

  return (
    <div className="fill-page">
      <PageHeader
        title="Users"
        description={`People in ${user.organizationName} and their roles.`}
        actions={
          can(user, 'users.create') && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
              <Plus size={16} aria-hidden="true" />
              Add user
            </button>
          )
        }
      />
      <Card title={`Members (${members.items.length})`} flush fill>
        <AsyncContent
          status={members.status}
          error={members.error}
          hasData={members.items.length > 0}
          onRetry={() => dispatch(fetchOrganizationMembers(user.organizationId))}
        >
          <DataTable columns={columns} rows={members.items} caption="Team members" emptyMessage="No members yet." />
        </AsyncContent>
      </Card>

      {editing !== undefined && <MemberFormModal member={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
