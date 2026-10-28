import { useCallback, useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { isActiveAssessment, selectAssessmentById, selectAssessmentsState } from '../../features/assessments/assessmentsSlice';
import { cancelAssessment, fetchAssessments } from '../../features/assessments/assessmentsThunks';
import { selectFindingsState } from '../../features/findings/findingsSlice';
import { fetchFindings } from '../../features/findings/findingsThunks';
import { selectScansState } from '../../features/scans/scansSlice';
import { fetchScans } from '../../features/scans/scansThunks';
import { showToast } from '../../features/ui/uiSlice';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import DetailList from '../../components/DetailList';
import FindingsTable from '../../components/FindingsTable';
import PageHeader from '../../components/PageHeader';
import ScansTable from '../../components/ScansTable';
import SeverityBadge from '../../components/SeverityBadge';
import { EmptyState } from '../../components/StateMessage';
import usePolling from '../../hooks/usePolling';
import { SEVERITIES } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';
import { can } from '../../utils/roles';
import { AssessmentStatus } from './AssessmentsPage';

export default function AssessmentDetailPage() {
  const { assessmentId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const assessments = useSelector(selectAssessmentsState);
  const assessment = useSelector((state) => selectAssessmentById(state, assessmentId));
  const scans = useSelector(selectScansState);
  const findings = useSelector(selectFindingsState);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchAssessments());
    dispatch(fetchScans());
    dispatch(fetchFindings());
  }, [dispatch]);

  // While jobs run, refresh the assessment, its jobs and its findings together.
  const refresh = useCallback(() => {
    dispatch(fetchAssessments({ silent: true }));
    dispatch(fetchScans({ silent: true }));
    dispatch(fetchFindings());
  }, [dispatch]);
  usePolling(refresh, Boolean(assessment && isActiveAssessment(assessment)), 3000);

  const breadcrumbs = [{ label: 'Assessments', to: '/assessments' }, { label: assessment?.name ?? assessmentId }];

  if (assessments.status === 'succeeded' && !assessment) {
    return (
      <>
        <PageHeader title="Assessment not found" breadcrumbs={breadcrumbs} />
        <EmptyState title="This assessment does not exist." action={<Link to="/assessments">Back to assessments</Link>} />
      </>
    );
  }

  const jobs = scans.items.filter((scan) => scan.assessmentId === assessmentId);
  const jobIds = jobs.map((scan) => scan.id);
  const assessmentFindings = findings.items.filter((finding) => jobIds.includes(finding.scanId));

  async function handleCancel() {
    if (!window.confirm(`Cancel ${assessment.id}? Queued and running jobs stop. Finished jobs and their findings are kept.`)) return;
    setIsCancelling(true);
    try {
      await dispatch(cancelAssessment(assessment.id)).unwrap();
      dispatch(fetchScans({ silent: true }));
      dispatch(showToast({ message: `${assessment.id} was cancelled.` }));
    } catch (error) {
      dispatch(showToast({ type: 'error', message: error.message }));
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <PageHeader
        title={assessment?.name ?? 'Assessment'}
        description={assessment && `${assessment.id} · ${assessment.profileName}`}
        breadcrumbs={breadcrumbs}
        actions={
          assessment &&
          isActiveAssessment(assessment) &&
          can(user, 'scans.cancel') && (
            <button type="button" className="btn btn-danger" onClick={handleCancel} disabled={isCancelling}>
              <Ban size={16} aria-hidden="true" />
              {isCancelling ? 'Cancelling…' : 'Cancel assessment'}
            </button>
          )
        }
      />

      <AsyncContent status={assessments.status} error={assessments.error} hasData={Boolean(assessment)} onRetry={() => dispatch(fetchAssessments())}>
        {assessment && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <Card title="Overview">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <AssessmentStatus assessment={assessment} />
                  <span className="text-[13px] text-slate-500">
                    {assessment.finishedJobCount} of {assessment.jobCount} jobs finished
                  </span>
                </div>
                <DetailList
                  items={[
                    {
                      label: 'Project',
                      value: (
                        <Link to={`/projects/${assessment.projectId}`}>
                          {assessment.projectCode} · {assessment.projectName}
                        </Link>
                      ),
                    },
                    { label: 'Profile', value: assessment.profileName },
                    { label: 'Started by', value: assessment.createdBy },
                    { label: 'Started', value: formatDateTime(assessment.createdAt) },
                  ]}
                />
              </Card>

              <Card title={`Findings (${assessment.findingCount})`}>
                <ul className="grid grid-cols-2 gap-2.5">
                  {SEVERITIES.map((severity) => (
                    <li key={severity} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                      <SeverityBadge severity={severity} />
                      <strong className="text-lg">{assessment.severityCounts[severity] ?? 0}</strong>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">Combined across every scan job in this assessment.</p>
              </Card>
            </div>

            <Card title={`Scan jobs (${jobs.length})`} flush>
              <p className="border-b border-slate-200 px-5 py-2.5 text-xs text-slate-500">One job per target. Jobs run in parallel up to worker capacity.</p>
              <AsyncContent status={scans.status} error={scans.error} hasData={scans.items.length > 0} onRetry={() => dispatch(fetchScans())}>
                <ScansTable scans={jobs} showProject={false} showActions emptyMessage="This assessment has no jobs." />
              </AsyncContent>
            </Card>

            {assessment.skipped.length > 0 && (
              <Card title={`Skipped targets (${assessment.skipped.length})`}>
                <ul className="flex flex-col gap-1.5 text-[13px]">
                  {assessment.skipped.map((item) => (
                    <li key={item.targetId} className="flex flex-wrap gap-x-2">
                      <strong>{item.targetName}</strong>
                      <span className="text-slate-500">{item.reason}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title="Consolidated findings" flush>
              <AsyncContent status={findings.status} error={findings.error} hasData={findings.items.length > 0 || findings.status === 'succeeded'} onRetry={() => dispatch(fetchFindings())}>
                <FindingsTable findings={assessmentFindings} emptyMessage={isActiveAssessment(assessment) ? 'No findings yet. Jobs are still running.' : 'No findings.'} />
              </AsyncContent>
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
