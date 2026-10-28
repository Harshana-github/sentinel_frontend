import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectProjectsState } from '../features/projects/projectsSlice';
import { fetchProjects } from '../features/projects/projectsThunks';
import { selectScannersState } from '../features/scanners/scannersSlice';
import { fetchScannerModules } from '../features/scanners/scannersThunks';
import { startScan } from '../features/scans/scansThunks';
import { showToast } from '../features/ui/uiSlice';
import { USE_MOCK_DATA } from '../services/api';
import { useMasterList } from '../features/masters/useMasterList';
import { SCAN_PROFILES } from '../utils/constants';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import Alert from './Alert';

export default function StartScanModal({ onClose, onStarted, initialProjectId = '', initialTargetId = '' }) {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjectsState);
  const scanners = useSelector(selectScannersState);
  const targetTypes = useMasterList('target-types');

  const [projectId, setProjectId] = useState(initialProjectId);
  const [targetId, setTargetId] = useState(initialTargetId);
  const [profile, setProfile] = useState('Standard');
  // null means "use the default tools for the selected target type".
  const [toolSelection, setToolSelection] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
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
  const compatibleModules = target ? scanners.items.filter((module) => module.enabled && module.targetTypes.includes(target.type)) : [];
  const selectedTools = toolSelection ?? compatibleModules.map((module) => module.id);

  function clearError(field) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleProjectChange(event) {
    setProjectId(event.target.value);
    setTargetId('');
    setToolSelection(null);
    clearError('projectId');
  }

  function handleTargetChange(event) {
    setTargetId(event.target.value);
    setToolSelection(null);
    clearError('targetId');
  }

  function toggleTool(toolId) {
    setToolSelection(
      selectedTools.includes(toolId) ? selectedTools.filter((id) => id !== toolId) : [...selectedTools, toolId],
    );
    clearError('tools');
  }

  function validate() {
    const validationErrors = {};
    if (!project) validationErrors.projectId = 'Select a project.';
    if (!target) validationErrors.targetId = 'Select a target.';
    if (target && selectedTools.length === 0) validationErrors.tools = 'Select at least one scanner module.';
    if (!isAuthorized) validationErrors.authorized = 'Confirm that you are authorized to scan this target.';
    return validationErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const scan = await dispatch(startScan({ projectId, targetId, profile, tools: selectedTools })).unwrap();
      dispatch(showToast({ message: `Scan ${scan.id} was queued for ${scan.targetName}.` }));
      onStarted(scan);
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Start a scan" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {USE_MOCK_DATA && (
          <Alert className="mb-4">Demo mode: the scan is simulated and no traffic is sent to the target.</Alert>
        )}
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        <FormField id="scan-project" label="Project" error={errors.projectId}>
          <select id="scan-project" className="input" value={projectId} onChange={handleProjectChange} {...errorProps('scan-project', errors.projectId)}>
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
          hint={project && project.targets.length === 0 ? 'This project has no targets yet. Add one from the project page.' : undefined}
        >
          <select id="scan-target" className="input" value={targetId} onChange={handleTargetChange} disabled={!project} {...errorProps('scan-target', errors.targetId)}>
            <option value="">Select a target</option>
            {project?.targets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}: {item.value}
              </option>
            ))}
          </select>
        </FormField>

        <fieldset className="mb-4">
          <legend className="mb-2 font-medium">Scan profile</legend>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
            {SCAN_PROFILES.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2.5 has-checked:border-blue-600 has-checked:bg-blue-50">
                <input className="mt-1" type="radio" name="profile" value={option.value} checked={profile === option.value} onChange={() => setProfile(option.value)} />
                <span className="flex flex-col">
                  <strong>{option.value}</strong>
                  <span className="text-slate-500 text-xs">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {target && (
          <fieldset className="mb-4" aria-describedby={errors.tools ? 'scan-tools-error' : undefined}>
            <legend className="mb-2 font-medium">Scanner modules for {targetTypes.nameOf(target.type).toLowerCase()}</legend>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
              {compatibleModules.map((module) => (
                <label key={module.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2.5 has-checked:border-blue-600 has-checked:bg-blue-50">
                  <input className="mt-1" type="checkbox" checked={selectedTools.includes(module.id)} onChange={() => toggleTool(module.id)} />
                  <span className="flex flex-col">
                    <strong>{module.name}</strong>
                    <span className="text-slate-500 text-xs">{module.categoryName}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.tools && (
              <p className="text-[13px] text-red-700" id="scan-tools-error">
                {errors.tools}
              </p>
            )}
          </fieldset>
        )}

        <div className="mb-4 flex flex-col gap-1.5">
          <label className="flex cursor-pointer items-start gap-2 font-medium">
            <input
              className="mt-1"
              type="checkbox"
              checked={isAuthorized}
              onChange={(event) => {
                setIsAuthorized(event.target.checked);
                clearError('authorized');
              }}
              {...errorProps('scan-authorized', errors.authorized)}
            />
            I confirm that I am authorized to scan this target.
          </label>
          {errors.authorized && (
            <p className="text-[13px] text-red-700" id="scan-authorized-error">
              {errors.authorized}
            </p>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Starting…' : 'Start scan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
