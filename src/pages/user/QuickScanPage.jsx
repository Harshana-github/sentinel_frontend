import { useEffect, useState } from 'react';
import { Layers, Play } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useMasterList } from '../../features/masters/useMasterList';
import { fetchProjects } from '../../features/projects/projectsThunks';
import { selectScannersState } from '../../features/scanners/scannersSlice';
import { fetchScannerModules } from '../../features/scanners/scannersThunks';
import { startQuickScan } from '../../features/scans/scansThunks';
import { showToast } from '../../features/ui/uiSlice';
import Alert from '../../components/Alert';
import Card from '../../components/Card';
import FormField, { errorProps } from '../../components/FormField';
import PageHeader from '../../components/PageHeader';
import { AuthorizationCheckbox, OptionCard, ScanProfilePicker, ToolPicker, useToolSelection } from '../../components/ScanOptions';
import { EmptyState } from '../../components/StateMessage';
import { USE_MOCK_DATA } from '../../services/api';
import { can } from '../../utils/roles';
import { targetAddressError } from '../../utils/target';

const MODES = [
  { value: 'single', icon: Play, title: 'Single scan', description: 'One target. You choose the profile and the tools.' },
  { value: 'full', icon: Layers, title: 'Full scan', description: 'One or more targets. Every available tool runs with the Deep profile.' },
];

// Scan straight from an address, without setting up a project or targets first.
// The API keeps these targets in the organization's "Quick scans" project.
export default function QuickScanPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const scanners = useSelector(selectScannersState);
  const targetTypes = useMasterList('target-types');

  const [mode, setMode] = useState('single');
  // Single scan: one type and address. Full scan: one address per target type.
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');
  const [addresses, setAddresses] = useState({});
  const [profile, setProfile] = useState('Standard');
  const [authorized, setAuthorized] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toolsFor = (typeId) => scanners.items.filter((tool) => tool.enabled && tool.targetTypes.includes(typeId));
  const toolSelection = useToolSelection(toolsFor(type));

  useEffect(() => {
    if (scanners.status === 'idle') dispatch(fetchScannerModules());
  }, [dispatch, scanners.status]);

  // Preselect the first target type once the list has loaded.
  useEffect(() => {
    if (!type && targetTypes.items.length > 0) setType(targetTypes.items[0].id);
  }, [type, targetTypes.items]);

  if (!can(user, 'scans.start')) {
    return (
      <>
        <PageHeader title="Quick scan" />
        <EmptyState title="You do not have permission to start scans." />
      </>
    );
  }

  const filledTypes = targetTypes.items.filter((item) => addresses[item.id]?.trim());
  const clearError = (field) => setErrors((current) => ({ ...current, [field]: undefined }));

  function validate() {
    const found = {};
    if (mode === 'single') {
      found.address = targetAddressError(address, targetTypes.find(type));
      if (toolSelection.selected.length === 0) found.tools = 'Select at least one tool.';
    } else {
      if (filledTypes.length === 0) found.full = 'Enter at least one target.';
      filledTypes.forEach((item) => {
        found[item.id] = targetAddressError(addresses[item.id], item);
      });
    }
    if (!authorized) found.authorized = 'Confirm that you are authorized to scan these targets.';
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    const inputs = mode === 'single' ? [{ type, value: address }] : filledTypes.map((item) => ({ type: item.id, value: addresses[item.id] }));
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const started = await dispatch(startQuickScan({ mode, inputs, profile, tools: toolSelection.selected, authorized })).unwrap();
      // The "Quick scans" project may be new or have new targets.
      dispatch(fetchProjects({ silent: true }));
      const isScan = started.kind === 'scan';
      dispatch(showToast({ message: isScan ? `Scan ${started.id} was queued.` : `Full scan ${started.id} was started.` }));
      navigate(isScan ? `/scans/${started.id}` : `/assessments/${started.id}`);
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Quick scan"
        description="Enter what you want to scan and start. No project or target setup needed; results appear under Scans and Findings as usual."
      />

      <form onSubmit={handleSubmit} noValidate className="flex max-w-3xl flex-col gap-5">
        {USE_MOCK_DATA && <Alert>Demo mode: scans are simulated and no traffic is sent to the target.</Alert>}

        <Card title="1 · What do you want to run?">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {MODES.map((option) => (
              <OptionCard
                key={option.value}
                name="mode"
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                title={
                  <>
                    <option.icon size={15} aria-hidden="true" className="text-blue-600" />
                    {option.title}
                  </>
                }
                description={option.description}
              />
            ))}
          </div>
        </Card>

        {mode === 'single' ? (
          <Card title="2 · Target and tools">
            <div className="grid gap-x-4 sm:grid-cols-[200px_1fr]">
              <FormField id="quick-type" label="Target type">
                <select
                  id="quick-type"
                  className="input"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    toolSelection.reset();
                    clearError('address');
                    clearError('tools');
                  }}
                >
                  {targetTypes.items.length === 0 && <option value="">Loading…</option>}
                  {targetTypes.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="quick-address" label="Address" error={errors.address}>
                <input
                  id="quick-address"
                  className="input font-mono"
                  value={address}
                  placeholder={targetTypes.find(type)?.placeholder}
                  autoFocus
                  onChange={(event) => {
                    setAddress(event.target.value);
                    clearError('address');
                  }}
                  {...errorProps('quick-address', errors.address)}
                />
              </FormField>
            </div>
            <ScanProfilePicker value={profile} onChange={setProfile} />
            <ToolPicker
              tools={toolsFor(type)}
              selection={toolSelection}
              error={errors.tools}
              emptyMessage={scanners.status === 'loading' ? 'Loading tools…' : undefined}
              onChange={() => clearError('tools')}
            />
          </Card>
        ) : (
          <Card title="2 · Targets">
            <p className="mb-4 text-[13px] text-slate-500">Fill in the ones you have and leave the rest empty. Each target runs as its own job.</p>
            {errors.full && (
              <Alert tone="error" className="mb-4">
                {errors.full}
              </Alert>
            )}
            {targetTypes.items.map((item) => {
              const tools = toolsFor(item.id);
              const id = `quick-full-${item.id}`;
              return (
                <FormField
                  key={item.id}
                  id={id}
                  label={item.name}
                  error={errors[item.id]}
                  hint={tools.length ? `Runs ${tools.map((tool) => tool.name).join(', ')}` : 'No enabled tool can scan this type yet.'}
                >
                  <input
                    id={id}
                    className="input font-mono"
                    value={addresses[item.id] ?? ''}
                    placeholder={item.placeholder}
                    disabled={tools.length === 0}
                    onChange={(event) => {
                      setAddresses((current) => ({ ...current, [item.id]: event.target.value }));
                      clearError(item.id);
                      clearError('full');
                    }}
                    {...errorProps(id, errors[item.id])}
                  />
                </FormField>
              );
            })}
          </Card>
        )}

        <Card>
          {submitError && (
            <Alert tone="error" className="mb-4">
              {submitError}
            </Alert>
          )}
          <AuthorizationCheckbox
            id="quick-authorized"
            plural={mode === 'full'}
            checked={authorized}
            error={errors.authorized}
            onChange={(checked) => {
              setAuthorized(checked);
              clearError('authorized');
            }}
          />
          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Play size={16} aria-hidden="true" />
              {isSubmitting ? 'Starting…' : mode === 'single' ? 'Start scan' : 'Start full scan'}
            </button>
          </div>
        </Card>
      </form>
    </>
  );
}
