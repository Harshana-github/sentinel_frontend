import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Building2, Radar, ShieldAlert, Users } from 'lucide-react';
import { selectPlatformSummary } from '../../features/admin/adminSlice';
import { fetchPlatformSummary } from '../../features/admin/adminThunks';
import { useStatusList } from '../../features/masters/useStatusList';
import AsyncContent from '../../components/AsyncContent';
import BarList from '../../components/BarList';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { CategoryStatusBadge } from '../../components/StatusBadge';
import { SCAN_STATUSES, SEVERITIES } from '../../utils/constants';
import { SCAN_STATUS_BAR_CLASSES, SEVERITY_BAR_CLASSES } from '../../utils/colors';
import { formatRelativeTime } from '../../utils/format';
import { useTranslation } from '../../i18n';

const organizationColumns = (t) => [
  {
    key: 'name',
    header: t('common.organization'),
    render: (organization) => (
      <Link to={`/admin/organizations/${organization.id}`} className="font-semibold">
        {organization.name}
      </Link>
    ),
  },
  { key: 'userCount', header: t('nav.users'), className: 'text-right' },
  { key: 'projectCount', header: t('nav.projects'), className: 'text-right' },
  { key: 'scanCount', header: t('admin.scans'), className: 'text-right' },
  { key: 'openFindingCount', header: t('projects.openFindings'), className: 'text-right' },
  {
    key: 'lastScanAt',
    header: t('projects.lastScan'),
    render: (organization) => (organization.lastScanAt ? formatRelativeTime(organization.lastScanAt) : t('common.never')),
  },
  {
    key: 'status',
    header: t('common.status'),
    render: (organization) => <CategoryStatusBadge category="organization-statuses" value={organization.status} />,
  },
];

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const scanStatuses = useStatusList('scan-statuses');
  const dispatch = useDispatch();
  const { data: summary, status, error } = useSelector(selectPlatformSummary);

  useEffect(() => {
    dispatch(fetchPlatformSummary());
  }, [dispatch]);

  return (
    <>
      <PageHeader title={t('admin.dashboardTitle')} description={t('admin.dashboardDescription')} />

      <AsyncContent status={status} error={error} hasData={Boolean(summary)} onRetry={() => dispatch(fetchPlatformSummary())}>
        {summary && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <StatCard
                icon={Building2}
                label={t('nav.organizations')}
                value={summary.totals.organizations}
                detail={t('admin.activeOrganizations', { count: summary.totals.activeOrganizations })}
                to="/admin/organizations"
              />
              <StatCard icon={Users} label={t('nav.users')} value={summary.totals.users} to="/admin/organizations" />
              <StatCard
                icon={Radar}
                label={t('admin.scans')}
                value={summary.totals.scans}
                detail={t('admin.runningNow', { count: summary.scanStatusCounts.Running })}
                to="/admin/organizations"
              />
              <StatCard
                icon={ShieldAlert}
                label={t('admin.openVulnerabilities')}
                value={summary.totals.openVulnerabilities}
                to="/admin/organizations"
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title={t('admin.scanStatusAll')}>
                <BarList
                  label={t('dashboard.scanStatus')}
                  items={SCAN_STATUSES.map((scanStatus) => ({
                    key: scanStatus,
                    label: scanStatuses.labelOf(scanStatus),
                    count: summary.scanStatusCounts[scanStatus],
                    barClass: SCAN_STATUS_BAR_CLASSES[scanStatus],
                  }))}
                />
              </Card>
              <Card title={t('dashboard.openBySeverity')}>
                <BarList
                  label={t('dashboard.openBySeverity')}
                  items={SEVERITIES.map((severity) => ({
                    key: severity,
                    label: t(`severity.${severity}`),
                    count: summary.openSeverityCounts[severity],
                    barClass: SEVERITY_BAR_CLASSES[severity],
                  }))}
                />
              </Card>
            </div>

            <Card title={t('admin.organizationsOverview')} flush actions={<Link to="/admin/organizations">{t('admin.manageOrganizations')}</Link>}>
              <DataTable
                columns={organizationColumns(t)}
                rows={summary.organizations}
                caption={t('admin.organizationsOverview')}
                emptyMessage={t('organizations.empty')}
              />
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
