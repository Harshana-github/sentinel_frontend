import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useMasterList } from '../features/masters/useMasterList';
import { selectProjectsState } from '../features/projects/projectsSlice';
import { fetchProjects } from '../features/projects/projectsThunks';
import { selectScannersState } from '../features/scanners/scannersSlice';
import { fetchScannerModules } from '../features/scanners/scannersThunks';
import { startScan } from '../features/scans/scansThunks';
import { showToast } from '../features/ui/uiSlice';
import { USE_MOCK_DATA } from '../services/api';
import { can } from '../utils/roles';
import AddTargetModal from './AddTargetModal';
import Alert from './Alert';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import { AuthorizationCheckbox, ScanProfilePicker, ToolPicker, useToolSelection } from './ScanOptions';

// Starts one scan of one target of a project.
export default function StartScanModal({ onClose, onStarted, initialProjectId = '', initialTargetId = '' }) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const projects = useSelector(selectProjectsState);
  const scanners = useSelector(selectScannersState);
  const targetTypes = useMasterList('target-types');

  const [projectId, setProjectId] = useState(initialProjectId);
  const [targetId, setTargetId] = useState(initialTargetId);
  const [profile, setProfile] = useState('Standard');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projects.status === 'idle') dispatch(fetchProjects());
    if (scanners.status === 'idle') dispatch(fetchScannerModules());
  }, [dispatch, projects.status, scanners.status]);

  const scannableProjects = projects.items.filter((project) => project.status !== 'Archived');
  const project = scannableProjects.find((item) => item.id === projectId);
  const target = project?.targets.find((item) => item.id === targetId);
  const tools = target ? scanners.items.filter((tool) => tool.enabled && tool.targetTypes.includes(target.type)) : [];
  const toolSelection = useToolSelection(tools);

  const clearError = (field) => setErrors((current) => ({ ...current, [field]: undefined }));

  function selectProject(id) {
    setProjectId(id);
    setTargetId('');
    toolSelection.reset();
    clearError('projectId');
  }

  function selectTarget(id) {
    setTargetId(id);
    toolSelection.reset();
    clearError('targetId');
  }

  function validate() {
    const found = {};
    if (!project) found.projectId = 'Select a project.';
    if (!target) found.targetId = 'Select a target.';
    if (target && toolSelection.selected.length === 0) found.tools = 'Select at least one scanner module.';
    if (!isAuthorized) found.authorized = 'Confirm that you are authorized to scan this target.';
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const scan = await dispatch(startScan({ projectId, targetId, profile, tools: toolSelection.selected })).unwrap();
      dispatch(showToast({ message: `Scan ${scan.id} was queued for ${scan.targetName}.` }));
      onStarted(scan);
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Modal title="Start a scan" onClose={onClose}>
        <form onSubmit={handleSubmit} noValidate>
          {USE_MOCK_DATA && <Alert className="mb-4">Demo mode: the scan is simulated and no traffic is sent to the target.</Alert>}
          {submitError && (
            <Alert tone="error" className="mb-4">
              {submitError}
            </Alert>
          )}

          <FormField id="scan-project" label="Project" error={errors.projectId}>
            <select
              id="scan-project"
              className="input"
              value={projectId}
              onChange={(event) => selectProject(event.target.value)}
              {...errorProps('scan-project', errors.projectId)}
            >
              <option value="">{projects.status === 'loading' ? 'Loading projects…' : 'Select a project'}</option>
              {scannableProjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.organizationName})
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="scan-target"
            label="Target"
            error={errors.targetId}
            hint={project && project.targets.length === 0 ? 'This project has no targets yet. Add one below.' : undefined}
          >
            <select
              id="scan-target"
              className="input"
              value={targetId}
              onChange={(event) => selectTarget(event.target.value)}
              disabled={!project}
              {...errorProps('scan-target', errors.targetId)}
            >
              <option value="">Select a target</option>
              {project?.targets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}: {item.value}
                </option>
              ))}
            </select>
            {project && can(user, 'targets.add') && (
              <button
                type="button"
                className="mt-1.5 flex cursor-pointer items-center gap-1 self-start text-[13px] font-medium text-blue-600 hover:underline"
                onClick={() => setIsAddTargetOpen(true)}
              >
                <Plus size={14} aria-hidden="true" />
                New target for {project.name}
              </button>
            )}
          </FormField>

          <ScanProfilePicker value={profile} onChange={setProfile} />

          {target && (
            <ToolPicker
              legend={`Scanner modules for ${targetTypes.nameOf(target.type).toLowerCase()}`}
              tools={tools}
              selection={toolSelection}
              error={errors.tools}
              onChange={() => clearError('tools')}
            />
          )}

          <AuthorizationCheckbox
            id="scan-authorized"
            checked={isAuthorized}
            error={errors.authorized}
            onChange={(checked) => {
              setIsAuthorized(checked);
              clearError('authorized');
            }}
          />

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Starting…' : 'Start scan'}
            </button>
          </div>
        </form>
      </Modal>
      {/* Opens on top of this dialog; the new target is selected straight away. */}
      {isAddTargetOpen && project && (
        <AddTargetModal project={project} onAdded={(added) => selectTarget(added.id)} onClose={() => setIsAddTargetOpen(false)} />
      )}
    </>
  );
}
