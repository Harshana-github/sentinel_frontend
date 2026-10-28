import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { selectOrganizationById, selectOrganizationsState } from '../features/organizations/organizationsSlice';
import { fetchOrganizations } from '../features/organizations/organizationsThunks';
import AsyncContent from '../components/AsyncContent';
import Card from '../components/Card';
import DetailList from '../components/DetailList';
import PageHeader from '../components/PageHeader';
import { CategoryStatusBadge } from '../components/StatusBadge';
import { API_BASE_URL, USE_MOCK_DATA } from '../services/api';
import { isSuperAdmin } from '../utils/roles';

// Shared by both panels. The organization card is only shown to organization users.
export default function SettingsPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const organizations = useSelector(selectOrganizationsState);
  const organization = useSelector((state) => selectOrganizationById(state, user?.organizationId));
  const showOrganization = !isSuperAdmin(user);

  useEffect(() => {
    if (showOrganization) dispatch(fetchOrganizations());
  }, [dispatch, showOrganization]);

  return (
    <>
      <PageHeader title="Settings" description="Your profile and how this frontend is configured." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Profile">
          <DetailList
            items={[
              { label: 'Name', value: user?.name },
              { label: 'Email', value: user?.email },
              { label: 'Username', value: user?.username },
              { label: 'Role', value: user?.role },
              { label: 'Panel', value: isSuperAdmin(user) ? 'Super Admin (Sentinel company)' : 'User panel' },
            ]}
          />
        </Card>

        {showOrganization && (
          <Card title="Organization">
            <AsyncContent status={organizations.status} error={organizations.error} hasData={Boolean(organization)} onRetry={() => dispatch(fetchOrganizations())}>
              {organization && (
                <DetailList
                  items={[
                    { label: 'Name', value: organization.name },
                    { label: 'Status', value: <CategoryStatusBadge category="organization-statuses" value={organization.status} /> },
                    { label: 'Contact', value: organization.contactEmail },
                  ]}
                />
              )}
            </AsyncContent>
          </Card>
        )}

        <Card title="Application">
          <DetailList
            items={[
              { label: 'Mode', value: USE_MOCK_DATA ? 'Mock data (no backend needed)' : 'API' },
              { label: 'API base URL', value: <code>{API_BASE_URL}</code> },
              { label: 'Session storage', value: 'Browser localStorage (demo only)' },
            ]}
          />
          <p className="text-slate-500 text-xs mt-3.5">
            These values come from the <code>.env</code> file and can be changed there. Restart the dev server after editing it.
          </p>
        </Card>
      </div>
    </>
  );
}
