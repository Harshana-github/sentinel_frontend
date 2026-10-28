import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Play, Radar, ShieldAlert, Users, Zap } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useStatusList } from '../../features/masters/useStatusList';
import { selectDashboardState } from '../../features/dashboard/dashboardSlice';
import { fetchDashboardSummary } from '../../features/dashboard/dashboardThunks';
import AsyncContent from '../../components/AsyncContent';
import BarList from '../../components/BarList';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import ScansTable from '../../components/ScansTable';
import StartScanModal from '../../components/StartScanModal';
import StatCard from '../../components/StatCard';
import usePolling from '../../hooks/usePolling';
import { SCAN_STATUSES, SEVERITIES } from '../../utils/constants';
import { SCAN_STATUS_BAR_CLASSES, SEVERITY_BAR_CLASSES } from '../../utils/colors';
import { formatRelativeTime } from '../../utils/format';
import { useTranslation } from '../../i18n';
import { can } from '../../utils/roles';

const ACTIVITY_DOT_CLASSES = {
  scan: 'bg-blue-600',
  finding: 'bg-orange-600',
  project: 'bg-green-600',
  organization: 'bg-violet-600',
  auth: 'bg-slate-400',
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();
  const scanStatuses = useStatusList('scan-statuses');
  const navigate = useNavigate();
  const { summary, status, error } = useSelector(selectDashboardState);
  const [isStartScanOpen, setIsStartScanOpen] = useState(false);

  const loadSummary = useCallback(() => dispatch(fetchDashboardSummary()), [dispatch]);
  const refreshSilently = useCallback(() => dispatch(fetchDashboardSummary({ silent: true })), [dispatch]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const hasActiveScans = Boolean(summary && summary.scanStatusCounts.Queued + summary.scanStatusCounts.Running > 0);
  usePolling(refreshSilently, hasActiveScans, 3000);

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          can(user, 'scans.start') && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setIsStartScanOpen(true)}>
                <Play size={16} aria-hidden="true" />
                {t('scans.singleScan')}
              </button>
              <Link to="/quick-scan" className="btn btn-primary hover:no-underline">
                <Zap size={16} aria-hidden="true" />
                {t('nav.quickScan')}
              </Link>
            </>
          )
        }
      />

      <AsyncContent status={status} error={error} hasData={Boolean(summary)} onRetry={loadSummary}>
        {summary && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <StatCard icon={FolderKanban} label={t('nav.projects')} value={summary.totals.projects} to="/projects" />
              <StatCard
                icon={Radar}
                label={t('nav.scans')}
                value={summary.totals.scans}
                detail={t('dashboard.scanDetail', { running: summary.scanStatusCounts.Running, queued: summary.scanStatusCounts.Queued })}
                to="/scans"
              />
              <StatCard
                icon={ShieldAlert}
                label={t('dashboard.vulnerabilities')}
                value={summary.totals.vulnerabilities}
                detail={t('dashboard.openDetail', { count: summary.totals.openVulnerabilities })}
                to="/findings"
              />
              <StatCard icon={Users} label={t('dashboard.members')} value={summary.totals.members} to="/team" />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title={t('dashboard.openBySeverity')}>
                <BarList
                  label={t('dashboard.openBySeverity')}
                  items={SEVERITIES.map((severity) => ({
                    key: severity,
                    label: t(`severity.${severity}`),
                    count: summary.openSeverityCounts[severity],
                    barClass: SEVERITY_BAR_CLASSES[severity],
                    to: `/findings?severity=${severity}`,
                  }))}
                />
              </Card>
              <Card title={t('dashboard.scanStatus')}>
                <BarList
                  label={t('dashboard.scanStatus')}
                  items={SCAN_STATUSES.map((scanStatus) => ({
                    key: scanStatus,
                    label: scanStatuses.labelOf(scanStatus),
                    count: summary.scanStatusCounts[scanStatus],
                    barClass: SCAN_STATUS_BAR_CLASSES[scanStatus],
                    to: `/scans?status=${scanStatus}`,
                  }))}
                />
              </Card>
            </div>

            <Card title={t('dashboard.recentScans')} flush actions={<Link to="/scans">{t('dashboard.viewAllScans')}</Link>}>
              <ScansTable scans={summary.recentScans} emptyMessage={t('dashboard.noScans')} />
            </Card>
            <Card title={t('dashboard.recentActivity')}>
              {summary.recentActivity.length === 0 ? (
                <p className="text-slate-500">{t('dashboard.noActivity')}</p>
              ) : (
                <ol className="flex flex-col gap-3.5">
                  {summary.recentActivity.map((activity) => (
                    <li key={activity.id} className="flex gap-2.5">
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${ACTIVITY_DOT_CLASSES[activity.type] ?? 'bg-slate-400'}`}
                        aria-hidden="true"
                      />
                      <div>
                        <p>{activity.message}</p>
                        <p className="text-xs text-slate-500">
                          {activity.actor} · <time dateTime={activity.createdAt}>{formatRelativeTime(activity.createdAt)}</time>
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        )}
      </AsyncContent>

      {isStartScanOpen && <StartScanModal onClose={() => setIsStartScanOpen(false)} onStarted={(scan) => navigate(`/scans/${scan.id}`)} />}
    </>
  );
}
