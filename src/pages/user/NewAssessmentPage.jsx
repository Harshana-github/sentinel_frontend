import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Layers, Play, Plus, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { startAssessment } from '../../features/assessments/assessmentsThunks';
import { useMasterList } from '../../features/masters/useMasterList';
import { selectProjectsState } from '../../features/projects/projectsSlice';
import { fetchProjects } from '../../features/projects/projectsThunks';
import { selectScannersState } from '../../features/scanners/scannersSlice';
import { fetchScannerModules } from '../../features/scanners/scannersThunks';
import { showToast } from '../../features/ui/uiSlice';
import AddTargetModal from '../../components/AddTargetModal';
import Alert from '../../components/Alert';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import { EmptyState } from '../../components/StateMessage';
import { ASSESSMENT_PROFILES } from '../../utils/constants';
import { useTranslation } from '../../i18n';
import { can } from '../../utils/roles';

const RULE_CLASSES = {
  required: 'bg-blue-100 text-blue-700',
  included: 'bg-slate-100 text-slate-600',
  optional: 'border border-dashed border-slate-300 text-slate-500',
};

function RuleChip({ rule, children }) {
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${RULE_CLASSES[rule]}`}>{children}</span>;
}

// One review line: ok (green tick), skip (grey cross) or block (amber warning).
function ReviewItem({ tone, title, detail }) {
  const Icon = tone === 'ok' ? Check : tone === 'block' ? AlertTriangle : X;
  const color = tone === 'ok' ? 'text-green-600' : tone === 'block' ? 'text-amber-600' : 'text-slate-400';
  return (
    <li className="flex gap-2">
      <Icon size={15} aria-hidden="true" className={`mt-0.5 shrink-0 ${color}`} />
      <span className="min-w-0">
        <span className="block">{title}</span>
        {detail && <span className="block text-xs text-slate-500">{detail}</span>}
      </span>
    </li>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h3>
      <ul className="flex flex-col gap-1.5 text-[13px]">{children}</ul>
    </div>
  );
}

// Plans an assessment in three steps: project, profile, targets. The review on the right shows
// what will run and what blocks the start; the API checks the same rules again.
export default function NewAssessmentPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector(selectCurrentUser);
  const projects = useSelector(selectProjectsState);
  const scanners = useSelector(selectScannersState);
  const targetTypes = useMasterList('target-types');

  const [projectId, setProjectId] = useState(searchParams.get('project') ?? '');
  const [profileKey, setProfileKey] = useState('webapp');
  // { [targetId]: true/false } only for targets the user switched; the rest follow the profile.
  const [choices, setChoices] = useState({});
  const [name, setName] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);

  useEffect(() => {
    if (projects.status === 'idle') dispatch(fetchProjects());
    if (scanners.status === 'idle') dispatch(fetchScannerModules());
  }, [dispatch, projects.status, scanners.status]);

  if (!can(user, 'scans.start')) {
    return (
      <>
        <PageHeader title={t('assessments.new')} breadcrumbs={[{ label: t('assessments.title'), to: '/assessments' }, { label: t('common.new') }]} />
        <EmptyState title={t('scans.noPermission')} />
      </>
    );
  }

  const activeProjects = projects.items.filter((project) => project.status !== 'Archived');
  const project = activeProjects.find((item) => item.id === projectId);
  const profile = ASSESSMENT_PROFILES.find((item) => item.key === profileKey);

  function pluginsFor(type) {
    const plugins = scanners.items.filter((plugin) => plugin.enabled && plugin.targetTypes.includes(type));
    return profile.plugins === 'primary' ? plugins.slice(0, 1) : plugins;
  }

  // Each target's place in the plan.
  const rows = (project?.targets ?? []).map((target) => {
    const rule = profile.types[target.type];
    const plugins = rule ? pluginsFor(target.type) : [];
    const available = Boolean(rule) && plugins.length > 0;
    const selected = available && (choices[target.id] ?? rule !== 'optional');
    let reason = '';
    if (!rule) reason = t('assessments.skipReasons.notInProfile');
    else if (!plugins.length) reason = t('assessments.skipReasons.noPlugin');
    else if (!selected) reason = t('assessments.skipReasons.notSelected');
    return { target, rule, plugins, available, selected, reason };
  });
  const planned = rows.filter((row) => row.selected);
  const skipped = rows.filter((row) => row.rule && !row.selected);

  const blockers = [];
  if (!project) blockers.push(t('assessments.blockers.project'));
  else {
    if (project.targets.length === 0) blockers.push(t('assessments.blockers.noTargets'));
    Object.entries(profile.types)
      .filter(([type, rule]) => rule === 'required' && !planned.some((row) => row.target.type === type))
      .forEach(([type]) => {
        const hasTarget = project.targets.some((target) => target.type === type);
        blockers.push(
          hasTarget
            ? t('assessments.blockers.selectRequired', { type: targetTypes.nameOf(type) })
            : t('assessments.blockers.missingRequired', { type: targetTypes.nameOf(type) }),
        );
      });
    if (project.targets.length > 0 && planned.length === 0 && blockers.length === 0) blockers.push(t('assessments.blockers.selectTarget'));
  }
  if (!authorized) blockers.push(t('assessments.blockers.authorize'));

  const pluginNames = [...new Set(planned.flatMap((row) => row.plugins.map((plugin) => plugin.name)))];

  function changeProject(id) {
    setProjectId(id);
    setChoices({});
    setStartError('');
  }

  function changeProfile(key) {
    setProfileKey(key);
    setChoices({});
    setStartError('');
  }

  const profileName = t(`assessmentProfiles.${profile.key}.name`);
  const defaultName = project ? `${profileName} · ${project.name}` : '';

  async function handleStart() {
    if (blockers.length > 0 || isStarting) return;
    setIsStarting(true);
    setStartError('');
    try {
      const assessment = await dispatch(
        startAssessment({
          projectId,
          profile: profileKey,
          name: name.trim() || defaultName,
          targetIds: planned.map((row) => row.target.id),
          authorized,
        }),
      ).unwrap();
      dispatch(showToast({ message: t('assessments.started', { id: assessment.id, count: assessment.jobCount }) }));
      navigate(`/assessments/${assessment.id}`);
    } catch (error) {
      setStartError(error.message);
      setIsStarting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t('assessments.new')}
        description={t('assessments.newDescription')}
        breadcrumbs={[{ label: t('assessments.title'), to: '/assessments' }, { label: t('common.new') }]}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card title={t('assessments.step1')}>
            <label htmlFor="assessment-project" className="mb-1.5 block font-medium">
              {t('projects.project')}
            </label>
            <select id="assessment-project" className="input max-w-md" value={projectId} onChange={(event) => changeProject(event.target.value)}>
              <option value="">{projects.status === 'loading' ? t('common.loading') : t('common.selectPlaceholder')}</option>
              {activeProjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name} ({t('assessments.targetCount', { count: item.targets.length })})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">{t('assessments.archivedHint')}</p>
          </Card>

          <Card title={t('assessments.step2')}>
            <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-label={t('assessments.profile')}>
              {ASSESSMENT_PROFILES.map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 p-3.5 has-checked:border-blue-600 has-checked:bg-blue-50/60 has-checked:ring-1 has-checked:ring-blue-600"
                >
                  <span className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="assessment-profile"
                      className="mt-1"
                      checked={profileKey === item.key}
                      onChange={() => changeProfile(item.key)}
                    />
                    <span className="min-w-0">
                      <strong className="block">{t(`assessmentProfiles.${item.key}.name`)}</strong>
                      <span className="text-xs text-slate-500">{t(`assessmentProfiles.${item.key}.description`)}</span>
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1 pl-6">
                    {Object.entries(item.types).map(([type, rule]) => (
                      <RuleChip key={type} rule={rule}>
                        {targetTypes.nameOf(type)}
                        {rule !== 'included' && ` · ${t(`assessments.rules.${rule}`)}`}
                      </RuleChip>
                    ))}
                  </span>
                  <span className="pl-6 text-[11px] text-slate-500">
                    {t(`assessmentProfiles.${item.key}.duration`)} · {t(`scanProfiles.${item.scanProfile}.name`)} ·{' '}
                    {item.plugins === 'primary' ? t('assessments.onePlugin') : t('assessments.allPlugins')}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Card
            title={t('assessments.step3')}
            flush
            actions={
              project &&
              can(user, 'targets.add') && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddTargetOpen(true)}>
                  <Plus size={14} aria-hidden="true" />
                  {t('targets.add')}
                </button>
              )
            }
          >
            {!project ? (
              <p className="px-5 py-8 text-center text-slate-500">{t('assessments.chooseProjectFirst')}</p>
            ) : rows.length === 0 ? (
              <p className="px-5 py-8 text-center text-slate-500">
                {t('targets.emptyTitle')}{' '}
                {can(user, 'targets.add') ? (
                  <button type="button" className="cursor-pointer font-medium text-blue-600 hover:underline" onClick={() => setIsAddTargetOpen(true)}>
                    {t('targets.addFirst')}
                  </button>
                ) : (
                  t('assessments.askForTargets')
                )}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {rows.map(({ target, rule, plugins, available, selected, reason }) => (
                  <li key={target.id}>
                    <label className={`flex items-start gap-3 px-5 py-3 ${available ? 'cursor-pointer hover:bg-slate-50' : 'opacity-60'}`}>
                      <input
                        type="checkbox"
                        className="mt-1 size-4 accent-blue-600"
                        checked={selected}
                        disabled={!available || rule === 'required'}
                        onChange={(event) => setChoices((current) => ({ ...current, [target.id]: event.target.checked }))}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong>{target.name}</strong>
                          <span className="text-xs text-slate-500">{targetTypes.nameOf(target.type)}</span>
                          {rule && <RuleChip rule={rule}>{t(`assessments.rules.${rule}`)}</RuleChip>}
                        </span>
                        <code className="mt-0.5 block truncate text-xs text-slate-500">{target.value}</code>
                        <span className="mt-1 block text-xs">
                          {selected ? (
                            <span className="text-green-700">Runs {plugins.map((plugin) => plugin.name).join(', ')}</span>
                          ) : (
                            <span className="text-slate-500">{reason}</span>
                          )}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card title={t('assessments.review')}>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="assessment-name" className="mb-1.5 block font-medium">
                  {t('common.name')} <span className="field-tag ml-1 bg-slate-100 text-slate-500">{t('common.optional')}</span>
                </label>
                <input
                  id="assessment-name"
                  className="input"
                  maxLength={80}
                  placeholder={defaultName || t('assessments.namePlaceholder')}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <ReviewSection title={t('assessments.profile')}>
                <ReviewItem
                  tone="ok"
                  title={profileName}
                  detail={`${t(`assessmentProfiles.${profile.key}.duration`)} · ${t(`scanProfiles.${profile.scanProfile}.name`)}`}
                />
              </ReviewSection>

              <ReviewSection title={t('assessments.willRun', { count: planned.length })}>
                {planned.length ? (
                  planned.map((row) => (
                    <ReviewItem key={row.target.id} tone="ok" title={row.target.name} detail={row.plugins.map((plugin) => plugin.name).join(', ')} />
                  ))
                ) : (
                  <ReviewItem tone="skip" title={t('assessments.nothingSelected')} />
                )}
              </ReviewSection>

              {skipped.length > 0 && (
                <ReviewSection title={t('assessments.willSkip', { count: skipped.length })}>
                  {skipped.map((row) => (
                    <ReviewItem key={row.target.id} tone="skip" title={row.target.name} detail={row.reason} />
                  ))}
                </ReviewSection>
              )}

              {pluginNames.length > 0 && (
                <ReviewSection title={t('scanOptions.tools')}>
                  <ReviewItem tone="ok" title={pluginNames.join(', ')} />
                </ReviewSection>
              )}

              {blockers.length > 0 && (
                <ReviewSection title={t('assessments.beforeStart')}>
                  {blockers.map((blocker) => (
                    <ReviewItem key={blocker} tone="block" title={blocker} />
                  ))}
                </ReviewSection>
              )}

              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-blue-600"
                  checked={authorized}
                  onChange={(event) => setAuthorized(event.target.checked)}
                />
                <span className="text-[13px]">
                  <strong className="block">{t('assessments.authorizationTitle')}</strong>
                  <span className="text-slate-500">{t('assessments.authorizationText')}</span>
                </span>
              </label>

              {startError && <Alert tone="error">{startError}</Alert>}

              <div>
                <button type="button" className="btn btn-primary w-full" disabled={blockers.length > 0 || isStarting} onClick={handleStart}>
                  <Play size={16} aria-hidden="true" />
                  {isStarting ? t('common.starting') : t('assessments.start')}
                </button>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                  <Layers size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
                  {blockers.length > 0 ? t('assessments.resolveFirst') : t('assessments.createsJobs', { count: planned.length })}
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* A new target appears in step 3 and follows the profile's default selection. */}
      {isAddTargetOpen && project && <AddTargetModal project={project} onClose={() => setIsAddTargetOpen(false)} />}
    </>
  );
}
