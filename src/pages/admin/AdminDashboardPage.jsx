import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Building2, Radar, ShieldAlert, Users } from 'lucide-react';
import { selectPlatformSummary } from '../../features/admin/adminSlice';
import { fetchPlatformSummary } from '../../features/admin/adminThunks';
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

const ORGANIZATION_COLUMNS = [
  {
    key: 'name',
    header: 'Organization',
    render: (organization) => (
      <Link to={`/admin/organizations/${organization.id}`} className="font-semibold">
        {organization.name}
      </Link>
    ),
  },
  { key: 'userCount', header: 'Users', className: 'text-right' },
  { key: 'projectCount', header: 'Projects', className: 'text-right' },
  { key: 'scanCount', header: 'Scans', className: 'text-right' },
  { key: 'openFindingCount', header: 'Open findings', className: 'text-right' },
  { key: 'lastScanAt', header: 'Last scan', render: (organization) => (organization.lastScanAt ? formatRelativeTime(organization.lastScanAt) : 'Never') },
  { key: 'status', header: 'Status', render: (organization) => <CategoryStatusBadge category="organization-statuses" value={organization.status} /> },
];

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const { data: summary, status, error } = useSelector(selectPlatformSummary);

  useEffect(() => {
    dispatch(fetchPlatformSummary());
  }, [dispatch]);

  return (
    <>
      <PageHeader title="Platform dashboard" description="Usage and security activity across every customer organization." />

      <AsyncContent status={status} error={error} hasData={Boolean(summary)} onRetry={() => dispatch(fetchPlatformSummary())}>
        {summary && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <StatCard
                icon={Building2}
                label="Organizations"
                value={summary.totals.organizations}
                detail={`${summary.totals.activeOrganizations} active or on trial`}
                to="/admin/organizations"
              />
              <StatCard icon={Users} label="Users" value={summary.totals.users} to="/admin/organizations" />
              <StatCard icon={Radar} label="Scans" value={summary.totals.scans} detail={`${summary.scanStatusCounts.Running} running now`} to="/admin/organizations" />
              <StatCard icon={ShieldAlert} label="Open vulnerabilities" value={summary.totals.openVulnerabilities} to="/admin/organizations" />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Scan status (all organizations)">
                <BarList
                  label="Scans by status"
                  items={SCAN_STATUSES.map((scanStatus) => ({
                    key: scanStatus,
                    label: scanStatus,
                    count: summary.scanStatusCounts[scanStatus],
                    barClass: SCAN_STATUS_BAR_CLASSES[scanStatus],
                  }))}
                />
              </Card>
              <Card title="Open vulnerabilities by severity">
                <BarList
                  label="Open vulnerabilities by severity"
                  items={SEVERITIES.map((severity) => ({
                    key: severity,
                    label: severity,
                    count: summary.openSeverityCounts[severity],
                    barClass: SEVERITY_BAR_CLASSES[severity],
                  }))}
                />
              </Card>
            </div>

            <Card title="Organizations overview" flush actions={<Link to="/admin/organizations">Manage organizations</Link>}>
              <DataTable columns={ORGANIZATION_COLUMNS} rows={summary.organizations} caption="Organizations overview" emptyMessage="No organizations yet." />
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
