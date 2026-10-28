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
import { useConfirm } from '../../components/ConfirmDialog';
import { useTranslation } from '../../i18n';

const baseColumns = (t) => [
  {
    key: 'name',
    header: t('common.name'),
    render: (member) => (
      <div className="flex min-w-40 flex-col gap-0.5">
        <span className="font-semibold">{member.name}</span>
        <span className="text-slate-500 text-xs">{member.email}</span>
      </div>
    ),
  },
  {
    key: 'role',
    header: t('team.role'),
    render: (member) => (
      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-slate-700">{member.roleName}</span>
    ),
  },
  { key: 'status', header: t('common.status'), render: (member) => <CategoryStatusBadge category="user-statuses" value={member.status} /> },
  {
    key: 'lastActiveAt',
    header: t('team.lastActive'),
    render: (member) => (member.lastActiveAt ? formatRelativeTime(member.lastActiveAt) : t('common.never')),
  },
];

export default function TeamPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const confirm = useConfirm();
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
    const confirmed = await confirm({
      title: t('team.deleteTitle'),
      message: t('team.deleteMessage', { name: member.name }),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!confirmed) return;
    setDeletingId(member.id);
    try {
      await dispatch(deleteMember(member.id)).unwrap();
      dispatch(showToast({ message: t('team.deleted', { name: member.name }) }));
    } catch (deleteError) {
      dispatch(showToast({ type: 'error', message: deleteError.message }));
      setDeletingId(null);
    }
  }

  const columns =
    canEdit || canDelete
      ? [
          ...baseColumns(t),
          {
            key: 'actions',
            header: t('common.actions'),
            className: 'w-24 text-right',
            render: (member) => {
              const isSelf = member.id === user.id;
              return (
                <div className="flex justify-end gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={t('common.editItem', { name: member.name })}
                      title={t('common.edit')}
                      onClick={() => setEditing(member)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className="icon-btn hover:text-red-700"
                      aria-label={t('common.deleteItem', { name: member.name })}
                      title={isSelf ? t('team.cannotDeleteSelf') : t('common.delete')}
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
      : baseColumns(t);

  if (!canView) {
    return (
      <>
        <PageHeader title={t('team.title')} />
        <EmptyState title={t('team.noPermission')} />
      </>
    );
  }

  return (
    <div className="fill-page">
      <PageHeader
        title={t('team.title')}
        description={t('team.description', { organization: user.organizationName })}
        actions={
          can(user, 'users.create') && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
              <Plus size={16} aria-hidden="true" />
              {t('team.add')}
            </button>
          )
        }
      />
      <Card title={t('team.membersCount', { count: members.items.length })} flush fill>
        <AsyncContent
          status={members.status}
          error={members.error}
          hasData={members.items.length > 0}
          onRetry={() => dispatch(fetchOrganizationMembers(user.organizationId))}
        >
          <DataTable columns={columns} rows={members.items} caption={t('team.title')} emptyMessage={t('team.empty')} />
        </AsyncContent>
      </Card>

      {editing !== undefined && <MemberFormModal member={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
