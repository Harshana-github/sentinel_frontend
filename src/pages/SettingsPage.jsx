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
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from '../i18n';

// Shared by both panels. The organization card is only shown to organization users.
export default function SettingsPage() {
  const dispatch = useDispatch();
  const { t, roleName } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const organizations = useSelector(selectOrganizationsState);
  const organization = useSelector((state) => selectOrganizationById(state, user?.organizationId));
  const showOrganization = !isSuperAdmin(user);

  useEffect(() => {
    if (showOrganization) dispatch(fetchOrganizations());
  }, [dispatch, showOrganization]);

  return (
    <>
      <PageHeader title={t('settings.title')} description={t('settings.description')} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title={t('settings.profile')}>
          <DetailList
            items={[
              { label: t('common.name'), value: user?.name },
              { label: t('team.email'), value: user?.email },
              { label: t('settings.username'), value: user?.username },
              { label: t('team.role'), value: roleName(user) },
              { label: t('settings.panel'), value: isSuperAdmin(user) ? t('nav.adminPanel') : t('settings.userPanel') },
            ]}
          />
        </Card>

        <Card title={t('settings.language')}>
          <p className="mb-3 text-slate-500">{t('settings.languageHelp')}</p>
          <LanguageSwitcher />
        </Card>

        {showOrganization && (
          <Card title={t('common.organization')}>
            <AsyncContent
              status={organizations.status}
              error={organizations.error}
              hasData={Boolean(organization)}
              onRetry={() => dispatch(fetchOrganizations())}
            >
              {organization && (
                <DetailList
                  items={[
                    { label: t('common.name'), value: organization.name },
                    { label: t('common.status'), value: <CategoryStatusBadge category="organization-statuses" value={organization.status} /> },
                    { label: t('settings.contact'), value: organization.contactEmail },
                  ]}
                />
              )}
            </AsyncContent>
          </Card>
        )}

        <Card title={t('settings.application')}>
          <DetailList
            items={[
              { label: t('settings.mode'), value: USE_MOCK_DATA ? t('settings.mockMode') : 'API' },
              { label: t('settings.apiUrl'), value: <code>{API_BASE_URL}</code> },
              { label: t('settings.sessionStorage'), value: t('settings.sessionStorageValue') },
            ]}
          />
          <p className="mt-3.5 text-xs text-slate-500">{t('settings.envNote')}</p>
        </Card>
      </div>
    </>
  );
}
