import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layers, Play, Plus } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectFindingsState } from '../../features/findings/findingsSlice';
import { fetchFindings } from '../../features/findings/findingsThunks';
import { selectProjectById, selectProjectsState } from '../../features/projects/projectsSlice';
import { fetchProjects } from '../../features/projects/projectsThunks';
import { isActiveScan, selectScansState } from '../../features/scans/scansSlice';
import { fetchScans } from '../../features/scans/scansThunks';
import AddTargetModal from '../../components/AddTargetModal';
import AsyncContent from '../../components/AsyncContent';
import BarList from '../../components/BarList';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import DetailList from '../../components/DetailList';
import FindingsTable from '../../components/FindingsTable';
import PageHeader from '../../components/PageHeader';
import ScansTable from '../../components/ScansTable';
import StartScanModal from '../../components/StartScanModal';
import { EmptyState } from '../../components/StateMessage';
import StatusBadge from '../../components/StatusBadge';
import usePolling from '../../hooks/usePolling';
import { useMasterList } from '../../features/masters/useMasterList';
import { OPEN_FINDING_STATUSES, SEVERITIES } from '../../utils/constants';
import { SEVERITY_BAR_CLASSES } from '../../utils/colors';
import { formatDate } from '../../utils/format';
import { can } from '../../utils/roles';
import Alert from '../../components/Alert';
import { useTranslation } from '../../i18n';

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const targetTypes = useMasterList('target-types');
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const projects = useSelector(selectProjectsState);
  const project = useSelector((state) => selectProjectById(state, projectId));
  const scans = useSelector(selectScansState);
  const findings = useSelector(selectFindingsState);
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  // { targetId } when the start-scan dialog is open, otherwise null.
  const [scanDialog, setScanDialog] = useState(null);

  const projectScans = scans.items.filter((scan) => scan.projectId === projectId);
  const projectFindings = findings.items.filter((finding) => finding.projectId === projectId);
  const openFindings = projectFindings.filter((finding) => OPEN_FINDING_STATUSES.includes(finding.status));
  const completedScanCount = projectScans.filter((scan) => scan.status === 'Completed').length;

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchScans());
  }, [dispatch, projectId]);

  // Findings are created when a scan completes, so reload them whenever that count changes.
  useEffect(() => {
    dispatch(fetchFindings());
  }, [dispatch, projectId, completedScanCount]);

  const refreshScans = useCallback(() => dispatch(fetchScans({ silent: true })), [dispatch]);
  usePolling(refreshScans, projectScans.some(isActiveScan));

  const breadcrumbs = [{ label: t('projects.title'), to: '/projects' }, { label: project?.name ?? projectId }];

  if (projects.status === 'succeeded' && !project) {
    return (
      <>
        <PageHeader title={t('projects.notFound')} breadcrumbs={breadcrumbs} />
        <EmptyState title={t('projects.notFoundMessage')} action={<Link to="/projects">{t('projects.backToList')}</Link>} />
      </>
    );
  }

  const isArchived = project?.status === 'Archived';

  const canStartScans = can(user, 'scans.start');

  const targetColumns = [
    { key: 'name', header: t('common.name') },
    { key: 'type', header: t('targets.type'), render: (target) => targetTypes.nameOf(target.type) },
    { key: 'value', header: t('targets.address'), render: (target) => <span className="font-mono">{target.value}</span> },
    { key: 'createdAt', header: t('targets.added'), render: (target) => formatDate(target.createdAt) },
    {
      key: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      render: (target) =>
        canStartScans && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setScanDialog({ targetId: target.id })}
            disabled={isArchived}
            aria-label={t('targets.scanLabel', { name: target.name })}
          >
            <Play size={14} aria-hidden="true" />
            {t('targets.scan')}
          </button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title={project?.name ?? t('projects.project')}
        description={project?.description}
        breadcrumbs={breadcrumbs}
        actions={
          project && (
            <>
              {can(user, 'targets.add') && (
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddTargetOpen(true)} disabled={isArchived}>
                  <Plus size={16} aria-hidden="true" />
                  {t('targets.add')}
                </button>
              )}
              {canStartScans && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(`/assessments/new?project=${project.id}`)}
                  disabled={isArchived || project.targets.length === 0}
                >
                  <Layers size={16} aria-hidden="true" />
                  {t('assessments.start')}
                </button>
              )}
              {canStartScans && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setScanDialog({ targetId: '' })}
                  disabled={isArchived || project.targets.length === 0}
                >
                  <Play size={16} aria-hidden="true" />
                  {t('scans.singleScan')}
                </button>
              )}
            </>
          )
        }
      />

      <AsyncContent status={projects.status} error={projects.error} hasData={Boolean(project)} onRetry={() => dispatch(fetchProjects())}>
        {project && (
          <div className="flex flex-col gap-5">
            {isArchived && <Alert>{t('projects.archivedNotice')}</Alert>}

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title={t('common.overview')}>
                <DetailList
                  items={[
                    { label: t('projects.code'), value: <code className="text-[13px] font-semibold">{project.code}</code> },
                    { label: t('common.organization'), value: project.organizationName },
                    { label: t('common.status'), value: <StatusBadge status={project.status} category="project-statuses" /> },
                    { label: t('projects.environment'), value: t(`environments.${project.environment}`) },
                    { label: t('projects.owner'), value: project.owner },
                    { label: t('common.created'), value: formatDate(project.createdAt) },
                    { label: t('nav.scans'), value: project.scanCount },
                  ]}
                />
              </Card>
              <Card title={t('projects.openFindingsCount', { count: openFindings.length })}>
                <BarList
                  label={t('dashboard.openBySeverity')}
                  items={SEVERITIES.map((severity) => ({
                    key: severity,
                    label: t(`severity.${severity}`),
                    count: openFindings.filter((finding) => finding.severity === severity).length,
                    barClass: SEVERITY_BAR_CLASSES[severity],
                  }))}
                />
              </Card>
            </div>

            <Card
              title={t('targets.titleCount', { count: project.targets.length })}
              flush
              actions={
                can(user, 'targets.add') &&
                !isArchived && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddTargetOpen(true)}>
                    <Plus size={14} aria-hidden="true" />
                    {t('targets.add')}
                  </button>
                )
              }
            >
              {project.targets.length === 0 ? (
                <EmptyState
                  title={t('targets.emptyTitle')}
                  message={t('targets.emptyMessage')}
                  action={
                    can(user, 'targets.add') &&
                    !isArchived && (
                      <button type="button" className="btn btn-primary" onClick={() => setIsAddTargetOpen(true)}>
                        <Plus size={16} aria-hidden="true" />
                        {t('targets.addFirst')}
                      </button>
                    )
                  }
                />
              ) : (
                <DataTable columns={targetColumns} rows={project.targets} caption={t('targets.title')} />
              )}
            </Card>

            <Card title={t('scans.titleCount', { count: projectScans.length })} flush>
              <AsyncContent status={scans.status} error={scans.error} hasData={scans.items.length > 0} onRetry={() => dispatch(fetchScans())}>
                <ScansTable scans={projectScans} showProject={false} showActions emptyMessage={t('projects.noScans')} />
              </AsyncContent>
            </Card>

            <Card title={t('findings.titleCount', { count: projectFindings.length })} flush>
              <AsyncContent
                status={findings.status}
                error={findings.error}
                hasData={findings.items.length > 0}
                onRetry={() => dispatch(fetchFindings())}
              >
                <FindingsTable findings={projectFindings} emptyMessage={t('projects.noFindings')} />
              </AsyncContent>
            </Card>
          </div>
        )}
      </AsyncContent>

      {isAddTargetOpen && project && !isArchived && <AddTargetModal project={project} onClose={() => setIsAddTargetOpen(false)} />}
      {scanDialog && project && (
        <StartScanModal
          initialProjectId={project.id}
          initialTargetId={scanDialog.targetId}
          onClose={() => setScanDialog(null)}
          onStarted={(scan) => navigate(`/scans/${scan.id}`)}
        />
      )}
    </>
  );
}
