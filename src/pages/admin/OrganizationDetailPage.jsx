import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { selectMembersOf, selectOrganizationById, selectOrganizationsState } from '../../features/organizations/organizationsSlice';
import { fetchOrganizationMembers, fetchOrganizations, updateOrganization } from '../../features/organizations/organizationsThunks';
import { selectProjectsState } from '../../features/projects/projectsSlice';
import { fetchProjects } from '../../features/projects/projectsThunks';
import { useMasterList } from '../../features/masters/useMasterList';
import { showToast } from '../../features/ui/uiSlice';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import CopyButton from '../../components/CopyButton';
import DataTable from '../../components/DataTable';
import DetailList from '../../components/DetailList';
import PageHeader from '../../components/PageHeader';
import { EmptyState } from '../../components/StateMessage';
import StatusBadge, { CategoryStatusBadge } from '../../components/StatusBadge';
import { buildLoginMessage } from '../../utils/loginMessage';
import { formatDate, formatRelativeTime } from '../../utils/format';
import { useConfirm } from '../../components/ConfirmDialog';
import { useTranslation } from '../../i18n';

const memberColumns = (t) => [
  {
    key: 'name',
    header: t('common.name'),
    render: (member) => (
      <div className="flex min-w-40 flex-col gap-0.5">
        <span>{member.name}</span>
        <span className="text-slate-500 text-xs">{member.email}</span>
      </div>
    ),
  },
  { key: 'status', header: t('common.status'), render: (member) => <CategoryStatusBadge category="user-statuses" value={member.status} /> },
  {
    key: 'lastActiveAt',
    header: t('team.lastActive'),
    render: (member) => (member.lastActiveAt ? formatRelativeTime(member.lastActiveAt) : t('common.never')),
  },
];

// Customer projects are listed for support only; they are managed in the user panel.
const projectColumns = (t) => [
  { key: 'name', header: t('projects.project') },
  { key: 'environment', header: t('projects.environment'), render: (project) => t(`environments.${project.environment}`) },
  { key: 'targets', header: t('projects.targets'), className: 'text-right', render: (project) => project.targets.length },
  { key: 'openFindingCount', header: t('projects.openFindings'), className: 'text-right' },
  { key: 'status', header: t('common.status'), render: (project) => <StatusBadge status={project.status} category="project-statuses" /> },
];

function StatusAction({ organization }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [isSaving, setIsSaving] = useState(false);
  const statuses = useMasterList('organization-statuses');
  const isSuspended = organization.status === 'suspended';
  const nextStatus = isSuspended ? 'active' : 'suspended';

  async function handleClick() {
    if (isSaving) return;
    if (!isSuspended) {
      const confirmed = await confirm({
        title: t('organizations.suspendTitle'),
        message: t('organizations.suspendMessage', { name: organization.name }),
        confirmLabel: t('organizations.suspend'),
        danger: true,
      });
      if (!confirmed) return;
    }
    setIsSaving(true);
    try {
      await dispatch(updateOrganization({ organizationId: organization.id, changes: { status: nextStatus } })).unwrap();
      dispatch(showToast({ message: t('organizations.statusChanged', { name: organization.name, status: statuses.nameOf(nextStatus) }) }));
    } catch (error) {
      dispatch(showToast({ type: 'error', message: error.message }));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button type="button" className={`btn ${isSuspended ? 'btn-primary' : 'btn-danger'}`} onClick={handleClick} disabled={isSaving}>
      {isSaving ? t('common.saving') : isSuspended ? t('organizations.reactivate') : t('organizations.suspend')}
    </button>
  );
}

// Lets the Super Admin copy what they need to support or contact the admin.
// Passwords are never stored in readable form, so they cannot be shown here.
function AdminCard({ organization, admin }) {
  const { t } = useTranslation();
  const loginUrl = `${window.location.origin}/login`;
  const summary = buildLoginMessage(organization, admin, t);
  const [showPassword, setShowPassword] = useState(false);
  const rows = [
    { label: t('common.name'), value: admin.name },
    { label: t('team.email'), value: admin.email },
    { label: t('auth.password'), value: admin.password, secret: true },
    { label: t('organizations.signInPage'), value: loginUrl },
  ];
  return (
    <Card title={t('organizations.admin')} actions={<CopyButton value={summary} label={t('copy.loginDetails')} text={t('copy.copyMessage')} />}>
      <dl className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="mb-0.5 text-xs text-slate-500">{row.label}</dt>
            <dd className="flex items-center gap-1 font-mono text-sm break-all">
              {row.secret ? (
                row.value ? (
                  showPassword ? (
                    row.value
                  ) : (
                    '••••••••'
                  )
                ) : (
                  <span className="font-sans text-slate-500">{t('organizations.notAvailable')}</span>
                )
              ) : (
                row.value
              )}
              {row.secret && row.value && (
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-slate-500">{t('organizations.passwordNote')}</p>
    </Card>
  );
}

export default function OrganizationDetailPage() {
  const { t } = useTranslation();
  const { organizationId } = useParams();
  const dispatch = useDispatch();
  const organizations = useSelector(selectOrganizationsState);
  const organization = useSelector((state) => selectOrganizationById(state, organizationId));
  const members = useSelector((state) => selectMembersOf(state, organizationId));
  const projects = useSelector(selectProjectsState);

  useEffect(() => {
    dispatch(fetchOrganizations());
    dispatch(fetchProjects());
    dispatch(fetchOrganizationMembers(organizationId));
  }, [dispatch, organizationId]);

  const breadcrumbs = [{ label: t('nav.organizations'), to: '/admin/organizations' }, { label: organization?.name ?? organizationId }];

  if (organizations.status === 'succeeded' && !organization) {
    return (
      <>
        <PageHeader title={t('organizations.notFound')} breadcrumbs={breadcrumbs} />
        <EmptyState title={t('organizations.notFoundMessage')} action={<Link to="/admin/organizations">{t('organizations.backToList')}</Link>} />
      </>
    );
  }

  const organizationProjects = projects.items.filter((project) => project.organizationId === organizationId);

  return (
    <>
      <PageHeader
        title={organization?.name ?? t('common.organization')}
        description={organization?.description}
        breadcrumbs={breadcrumbs}
        actions={organization && <StatusAction organization={organization} />}
      />
      <AsyncContent
        status={organizations.status}
        error={organizations.error}
        hasData={Boolean(organization)}
        onRetry={() => dispatch(fetchOrganizations())}
      >
        {organization && (
          <div className="flex flex-col gap-5">
            <Card title={t('common.overview')}>
              <DetailList
                items={[
                  { label: t('slug.label'), value: <code className="text-[13px]">{organization.slug}</code> },
                  { label: t('common.status'), value: <CategoryStatusBadge category="organization-statuses" value={organization.status} /> },
                  { label: t('settings.contact'), value: organization.contactEmail },
                  { label: t('organizations.members'), value: organization.memberCount },
                  { label: t('nav.projects'), value: organization.projectCount },
                  { label: t('common.created'), value: formatDate(organization.createdAt) },
                ]}
              />
            </Card>

            {organization.admin && <AdminCard organization={organization} admin={organization.admin} />}

            <Card title={t('team.membersCount', { count: members.items.length })} flush>
              <AsyncContent
                status={members.status}
                error={members.error}
                hasData={members.items.length > 0}
                onRetry={() => dispatch(fetchOrganizationMembers(organizationId))}
              >
                <DataTable columns={memberColumns(t)} rows={members.items} caption={t('organizations.members')} emptyMessage={t('team.empty')} />
              </AsyncContent>
            </Card>

            <Card title={t('organizations.projectsCount', { count: organizationProjects.length })} flush>
              <AsyncContent
                status={projects.status}
                error={projects.error}
                hasData={projects.items.length > 0}
                onRetry={() => dispatch(fetchProjects())}
              >
                <DataTable
                  columns={projectColumns(t)}
                  rows={organizationProjects}
                  caption={t('nav.projects')}
                  emptyMessage={t('organizations.noProjects')}
                />
              </AsyncContent>
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
