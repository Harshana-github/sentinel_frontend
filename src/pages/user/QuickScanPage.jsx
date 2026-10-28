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
import { useTranslation } from '../../i18n';
import { can } from '../../utils/roles';
import { targetAddressError } from '../../utils/target';

// Labels: quickScan.modes.<value>.
const MODES = [
  { value: 'single', icon: Play },
  { value: 'full', icon: Layers },
];

// Scan straight from an address, without setting up a project or targets first.
// The API keeps these targets in the organization's "Quick scans" project.
export default function QuickScanPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
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
        <PageHeader title={t('nav.quickScan')} />
        <EmptyState title={t('scans.noPermission')} />
      </>
    );
  }

  const filledTypes = targetTypes.items.filter((item) => addresses[item.id]?.trim());
  const clearError = (field) => setErrors((current) => ({ ...current, [field]: undefined }));

  function validate() {
    const found = {};
    if (mode === 'single') {
      found.address = t(targetAddressError(address, targetTypes.find(type)));
      if (toolSelection.selected.length === 0) found.tools = t('scans.toolsRequired');
    } else {
      if (filledTypes.length === 0) found.full = t('quickScan.targetRequired');
      filledTypes.forEach((item) => {
        found[item.id] = t(targetAddressError(addresses[item.id], item));
      });
    }
    if (!authorized) found.authorized = t('scans.authorizationRequired');
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
      const name = t('quickScan.defaultName', { target: inputs[0].value.trim() });
      const started = await dispatch(startQuickScan({ mode, inputs, profile, tools: toolSelection.selected, name, authorized })).unwrap();
      // The "Quick scans" project may be new or have new targets.
      dispatch(fetchProjects({ silent: true }));
      const isScan = started.kind === 'scan';
      dispatch(showToast({ message: isScan ? t('scans.queued', { id: started.id }) : t('quickScan.fullStarted', { id: started.id }) }));
      navigate(isScan ? `/scans/${started.id}` : `/assessments/${started.id}`);
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title={t('nav.quickScan')} description={t('quickScan.description')} />

      {/* Steps 1 and 2 on the left; on wide screens step 3 stays in view on the right. */}
      <form onSubmit={handleSubmit} noValidate className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          {USE_MOCK_DATA && <Alert>{t('scans.demoNotice')}</Alert>}

          <Card title={t('quickScan.step1')}>
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
                      {t(`quickScan.modes.${option.value}.title`)}
                    </>
                  }
                  description={t(`quickScan.modes.${option.value}.description`)}
                />
              ))}
            </div>
          </Card>

          {mode === 'single' ? (
            <Card title={t('quickScan.step2Single')}>
              <div className="grid gap-x-4 sm:grid-cols-[200px_1fr]">
                <FormField id="quick-type" label={t('targets.type')} required>
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
                    {targetTypes.items.length === 0 && <option value="">{t('common.loading')}</option>}
                    {targetTypes.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {targetTypes.nameOf(item.id)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="quick-address" label={t('targets.address')} required error={errors.address}>
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
                emptyMessage={scanners.status === 'loading' ? t('common.loading') : undefined}
                onChange={() => clearError('tools')}
              />
            </Card>
          ) : (
            <Card title={t('quickScan.step2Full')}>
              <p className="mb-4 text-[13px] text-slate-500">{t('quickScan.fullHelp')}</p>
              {errors.full && (
                <Alert tone="error" className="mb-4">
                  {errors.full}
                </Alert>
              )}
              <div className="grid gap-x-4 lg:grid-cols-2">
                {targetTypes.items.map((item) => {
                  const tools = toolsFor(item.id);
                  const id = `quick-full-${item.id}`;
                  return (
                    <FormField
                      key={item.id}
                      id={id}
                      label={targetTypes.nameOf(item.id)}
                      error={errors[item.id]}
                      hint={tools.length ? t('quickScan.runs', { tools: tools.map((tool) => tool.name).join(', ') }) : t('scanOptions.noTools')}
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
              </div>
            </Card>
          )}
        </div>

        <aside className="xl:sticky xl:top-20">
          <Card title={t('quickScan.step3')}>
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
              <button type="submit" className="btn btn-primary h-10 xl:w-full" disabled={isSubmitting}>
                <Play size={16} aria-hidden="true" />
                {isSubmitting ? t('common.starting') : mode === 'single' ? t('scans.start') : t('quickScan.startFull')}
              </button>
            </div>
          </Card>
        </aside>
      </form>
    </>
  );
}
