import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectFindingById, selectFindingsState } from '../../features/findings/findingsSlice';
import { fetchFindings, updateFindingStatus } from '../../features/findings/findingsThunks';
import { showToast } from '../../features/ui/uiSlice';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import DetailList from '../../components/DetailList';
import PageHeader from '../../components/PageHeader';
import SeverityBadge from '../../components/SeverityBadge';
import { EmptyState } from '../../components/StateMessage';
import StatusBadge from '../../components/StatusBadge';
import { USE_MOCK_DATA } from '../../services/api';
import { useMasterList } from '../../features/masters/useMasterList';
import { useStatusList } from '../../features/masters/useStatusList';
import { FINDING_STATUSES } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';
import { useTranslation } from '../../i18n';
import { can } from '../../utils/roles';

function StatusForm({ finding }) {
  const { t } = useTranslation();
  const findingStatuses = useStatusList('finding-statuses');
  const dispatch = useDispatch();
  const [newStatus, setNewStatus] = useState(finding.status);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || newStatus === finding.status) return;
    setIsSaving(true);
    try {
      await dispatch(updateFindingStatus({ findingId: finding.id, status: newStatus })).unwrap();
      dispatch(showToast({ message: t('findings.statusChanged', { id: finding.id, status: findingStatuses.labelOf(newStatus) }) }));
    } catch (error) {
      dispatch(showToast({ type: 'error', message: error.message }));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="flex flex-wrap items-center gap-2.5" onSubmit={handleSubmit}>
      <label htmlFor="finding-status" className="font-medium">
        {t('common.status')}
      </label>
      <select id="finding-status" className="input w-auto min-w-42" value={newStatus} onChange={(event) => setNewStatus(event.target.value)}>
        {findingStatuses.options(FINDING_STATUSES).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-primary" disabled={isSaving || newStatus === finding.status}>
        {isSaving ? t('common.saving') : t('findings.updateStatus')}
      </button>
    </form>
  );
}

export default function FindingDetailPage() {
  const { t } = useTranslation();
  const targetTypes = useMasterList('target-types');
  const { findingId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { status, error } = useSelector(selectFindingsState);
  const finding = useSelector((state) => selectFindingById(state, findingId));

  useEffect(() => {
    dispatch(fetchFindings());
  }, [dispatch, findingId]);

  const breadcrumbs = [{ label: t('findings.title'), to: '/findings' }, { label: findingId }];

  if (status === 'succeeded' && !finding) {
    return (
      <>
        <PageHeader title={t('findings.notFound')} breadcrumbs={breadcrumbs} />
        <EmptyState title={t('findings.notFoundMessage')} action={<Link to="/findings">{t('findings.backToList')}</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={finding?.title ?? t('findings.finding')} breadcrumbs={breadcrumbs} />
      <AsyncContent status={status} error={error} hasData={Boolean(finding)} onRetry={() => dispatch(fetchFindings())}>
        {finding && (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="flex flex-col gap-5">
              <Card>
                <div className="flex gap-2">
                  <SeverityBadge severity={finding.severity} />
                  <StatusBadge status={finding.status} category="finding-statuses" />
                </div>
                {/* key resets the form when the stored status changes */}
                {can(user, 'findings.update') && (
                  <div className="mt-3.5">
                    <StatusForm key={finding.status} finding={finding} />
                  </div>
                )}
              </Card>
              <Card title={t('common.description')}>
                <p>{finding.description}</p>
              </Card>
              <Card title={t('findings.evidence')}>
                {USE_MOCK_DATA && (
                  <p className="mb-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {t('findings.demoEvidence')}
                  </p>
                )}
                <pre className="rounded-md bg-slate-900 p-3 font-mono text-[13px] break-words whitespace-pre-wrap text-slate-200">
                  {finding.evidence}
                </pre>
              </Card>
              <Card title={t('findings.remediation')}>
                <p>{finding.remediation}</p>
              </Card>
            </div>

            <Card title={t('common.details')}>
              <DetailList
                columns="single"
                items={[
                  { label: t('findings.id'), value: finding.id },
                  { label: t('findings.affectedTarget'), value: finding.targetName },
                  { label: t('targets.address'), value: <span className="font-mono">{finding.targetValue}</span> },
                  { label: t('targets.type'), value: targetTypes.nameOf(finding.targetType) },
                  { label: t('findings.location'), value: <span className="font-mono">{finding.location}</span> },
                  { label: 'CVE', value: finding.cve },
                  { label: 'CWE', value: finding.cwe },
                  { label: t('findings.scanner'), value: finding.scannerName },
                  { label: t('scans.scan'), value: <Link to={`/scans/${finding.scanId}`}>{finding.scanId}</Link> },
                  { label: t('projects.project'), value: <Link to={`/projects/${finding.projectId}`}>{finding.projectName}</Link> },
                  { label: t('common.organization'), value: finding.organizationName },
                  { label: t('findings.discovered'), value: formatDateTime(finding.discoveredAt) },
                  { label: t('common.updated'), value: formatDateTime(finding.updatedAt) },
                ]}
              />
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
