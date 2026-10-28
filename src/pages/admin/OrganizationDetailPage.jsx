import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { selectMembersOf, selectOrganizationById, selectOrganizationsState } from '../../features/organizations/organizationsSlice';
import {
  fetchOrganizationMembers,
  fetchOrganizations,
  updateOrganization,
} from '../../features/organizations/organizationsThunks';
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

const MEMBER_COLUMNS = [
  {
    key: 'name',
    header: 'Name',
    render: (member) => (
      <div className="flex min-w-40 flex-col gap-0.5">
        <span>{member.name}</span>
        <span className="text-slate-500 text-xs">{member.email}</span>
      </div>
    ),
  },
  { key: 'status', header: 'Status', render: (member) => <CategoryStatusBadge category="user-statuses" value={member.status} /> },
  { key: 'lastActiveAt', header: 'Last active', render: (member) => (member.lastActiveAt ? formatRelativeTime(member.lastActiveAt) : 'Never') },
];

// Customer projects are listed for support only; they are managed in the user panel.
const PROJECT_COLUMNS = [
  { key: 'name', header: 'Project' },
  { key: 'environment', header: 'Environment' },
  { key: 'targets', header: 'Targets', className: 'text-right', render: (project) => project.targets.length },
  { key: 'openFindingCount', header: 'Open findings', className: 'text-right' },
  { key: 'status', header: 'Status', render: (project) => <StatusBadge status={project.status} /> },
];

function StatusAction({ organization }) {
  const dispatch = useDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const statuses = useMasterList('organization-statuses');
  const isSuspended = organization.status === 'suspended';
  const nextStatus = isSuspended ? 'active' : 'suspended';

  async function handleClick() {
    if (isSaving) return;
    if (!isSuspended && !window.confirm(`Suspend ${organization.name}? Its users will not be able to sign in.`)) return;
    setIsSaving(true);
    try {
      await dispatch(updateOrganization({ organizationId: organization.id, changes: { status: nextStatus } })).unwrap();
      dispatch(showToast({ message: `${organization.name} is now ${statuses.nameOf(nextStatus).toLowerCase()}.` }));
    } catch (error) {
      dispatch(showToast({ type: 'error', message: error.message }));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button type="button" className={`btn ${isSuspended ? 'btn-primary' : 'btn-danger'}`} onClick={handleClick} disabled={isSaving}>
      {isSaving ? 'Saving…' : isSuspended ? 'Reactivate organization' : 'Suspend organization'}
    </button>
  );
}

// Lets the Super Admin copy what they need to support or contact the admin.
// Passwords are never stored in readable form, so they cannot be shown here.
function AdminCard({ organization, admin }) {
  const loginUrl = `${window.location.origin}/login`;
  const summary = buildLoginMessage(organization, admin);
  const [showPassword, setShowPassword] = useState(false);
  const rows = [
    { label: 'Name', value: admin.name },
    { label: 'Email', value: admin.email },
    { label: 'Password', value: admin.password, secret: true },
    { label: 'Sign-in page', value: loginUrl },
  ];
  return (
    <Card
      title="Organization admin"
      actions={<CopyButton value={summary} label="Copy a ready-to-send message with the login details" text="Copy message to send" />}
    >
      <dl className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="mb-0.5 text-xs text-slate-500">{row.label}</dt>
            <dd className="flex items-center gap-1 font-mono text-sm break-all">
              {row.secret ? (row.value ? (showPassword ? row.value : '••••••••') : <span className="font-sans text-slate-500">Not available</span>) : row.value}
              {row.secret && row.value && (
                <button type="button" className="icon-btn" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-slate-500">Demo data only. A real backend stores hashed passwords, so it could not show them; it would need a reset or a one-time temporary password instead.</p>
    </Card>
  );
}

export default function OrganizationDetailPage() {
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

  const breadcrumbs = [{ label: 'Organizations', to: '/admin/organizations' }, { label: organization?.name ?? organizationId }];

  if (organizations.status === 'succeeded' && !organization) {
    return (
      <>
        <PageHeader title="Organization not found" breadcrumbs={breadcrumbs} />
        <EmptyState title="This organization does not exist." action={<Link to="/admin/organizations">Back to organizations</Link>} />
      </>
    );
  }

  const organizationProjects = projects.items.filter((project) => project.organizationId === organizationId);

  return (
    <>
      <PageHeader
        title={organization?.name ?? 'Organization'}
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
            <Card title="Overview">
              <DetailList
                items={[
                  { label: 'Slug', value: <code className="text-[13px]">{organization.slug}</code> },
                  { label: 'Status', value: <CategoryStatusBadge category="organization-statuses" value={organization.status} /> },
                  { label: 'Contact', value: organization.contactEmail },
                  { label: 'Members', value: organization.memberCount },
                  { label: 'Projects', value: organization.projectCount },
                  { label: 'Created', value: formatDate(organization.createdAt) },
                ]}
              />
            </Card>

            {organization.admin && <AdminCard organization={organization} admin={organization.admin} />}

            <Card title={`Members (${members.items.length})`} flush>
              <AsyncContent
                status={members.status}
                error={members.error}
                hasData={members.items.length > 0}
                onRetry={() => dispatch(fetchOrganizationMembers(organizationId))}
              >
                <DataTable columns={MEMBER_COLUMNS} rows={members.items} caption="Members" emptyMessage="No members yet." />
              </AsyncContent>
            </Card>

            <Card title={`Projects (${organizationProjects.length})`} flush>
              <AsyncContent status={projects.status} error={projects.error} hasData={projects.items.length > 0} onRetry={() => dispatch(fetchProjects())}>
                <DataTable columns={PROJECT_COLUMNS} rows={organizationProjects} caption="Projects" emptyMessage="This organization has no projects yet." />
              </AsyncContent>
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
