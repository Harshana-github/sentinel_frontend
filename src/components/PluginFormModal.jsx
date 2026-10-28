import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useMasterList } from '../features/masters/useMasterList';
import { registerScannerModule, updateScannerModule } from '../features/scanners/scannersThunks';
import { showToast } from '../features/ui/uiSlice';
import Alert from './Alert';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import SlugField from './SlugField';
import { slugError } from '../utils/slug';

const SECTION_HEADING = 'mb-3 text-[13px] font-semibold tracking-wide text-slate-500 uppercase';
const MISSING_HINT = 'Missing one? Add it on the Master Data page.';

const EMPTY_PLUGIN = {
  name: '',
  slug: '',
  version: '',
  source: '',
  category: '',
  purpose: '',
  targetTypes: [],
  interface: '',
  command: '',
  image: '',
  license: '',
  integrationStatus: '',
  enabled: true,
};

function validate(form, pluginInterface, isNew) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter the plugin name.';
  if (isNew && slugError(form.slug)) errors.slug = slugError(form.slug);
  if (!form.version.trim()) errors.version = 'Enter the version.';
  if (!form.source) errors.source = 'Choose a source.';
  if (!form.category) errors.category = 'Choose a category.';
  if (form.targetTypes.length === 0) errors.targetTypes = 'Select at least one target type.';
  if (!form.interface) errors.interface = 'Choose an interface.';
  if (pluginInterface?.kind === 'command' && !form.command.includes('{target}')) errors.command = 'The command must contain {target}.';
  if (pluginInterface?.kind === 'url' && !/^https?:\/\//.test(form.command.trim())) errors.command = 'Enter the endpoint URL (http or https).';
  if (!form.image.trim()) errors.image = 'Enter the container image.';
  if (!form.license) errors.license = 'Choose a license.';
  if (!form.integrationStatus) errors.integrationStatus = 'Choose a status.';
  return errors;
}

// A <select> filled from a master data list.
function MasterSelect({ id, list, value, error, onChange }) {
  return (
    <select id={id} className="input" value={value} onChange={(event) => onChange(event.target.value)} {...errorProps(id, error)}>
      <option value="">{list.status === 'loading' ? 'Loading…' : 'Choose…'}</option>
      {list.items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}

// Register a new plugin, or edit one when `plugin` is set. Every choice comes from master data.
export default function PluginFormModal({ plugin, onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(plugin ? { ...EMPTY_PLUGIN, ...plugin, slug: plugin.id } : EMPTY_PLUGIN);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const sources = useMasterList('plugin-sources');
  const categories = useMasterList('plugin-categories');
  const targetTypes = useMasterList('target-types');
  const interfaces = useMasterList('plugin-interfaces');
  const licenses = useMasterList('licenses');
  const statuses = useMasterList('integration-statuses');
  const pluginInterface = interfaces.find(form.interface);

  // A new plugin starts with the first source and interface once those lists have loaded.
  useEffect(() => {
    if (plugin) return;
    setForm((current) => ({
      ...current,
      source: current.source || sources.items[0]?.id || '',
      interface: current.interface || interfaces.items[0]?.id || '',
    }));
  }, [plugin, sources.items, interfaces.items]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function toggleTargetType(type) {
    setField('targetTypes', form.targetTypes.includes(type) ? form.targetTypes.filter((item) => item !== type) : [...form.targetTypes, type]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    const validationErrors = validate(form, pluginInterface, !plugin);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setSubmitError('');
    try {
      const saved = plugin
        ? await dispatch(updateScannerModule({ id: plugin.id, changes: form })).unwrap()
        : await dispatch(registerScannerModule(form)).unwrap();
      dispatch(showToast({ message: `${saved.name} ${plugin ? 'updated' : 'registered'}.` }));
      onClose();
    } catch (saveError) {
      setSubmitError(saveError.message);
      setIsSaving(false);
    }
  }

  const asksForUrl = pluginInterface?.kind === 'url';

  return (
    <Modal title={plugin ? `Edit ${plugin.name}` : 'Register scanner plugin'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        <section className="mb-2">
          <h3 className={SECTION_HEADING}>Tool</h3>
          <fieldset className="mb-4" aria-describedby={errors.source ? 'plugin-source-error' : undefined}>
            <legend className="mb-1.5 font-medium">Source</legend>
            {sources.status === 'loading' && <p className="text-[13px] text-slate-500">Loading sources…</p>}
            {sources.status === 'succeeded' && sources.items.length === 0 && <p className="text-[13px] text-slate-500">No sources yet. {MISSING_HINT}</p>}
            <div className="grid grid-cols-2 gap-2">
              {sources.items.map((source) => (
                <label key={source.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2.5 has-checked:border-blue-600 has-checked:bg-blue-50">
                  <input className="mt-1" type="radio" name="source" checked={form.source === source.id} onChange={() => setField('source', source.id)} />
                  <span className="flex flex-col">
                    <strong>{source.name}</strong>
                    {source.description && <span className="text-xs text-slate-500">{source.description}</span>}
                  </span>
                </label>
              ))}
            </div>
            {errors.source && (
              <p id="plugin-source-error" className="mt-1.5 text-[13px] text-red-700">
                {errors.source}
              </p>
            )}
          </fieldset>
          <div className="grid gap-x-3 sm:grid-cols-[1fr_140px]">
            <FormField id="plugin-name" label="Name" error={errors.name}>
              <input id="plugin-name" className="input" value={form.name} autoFocus onChange={(event) => setField('name', event.target.value)} {...errorProps('plugin-name', errors.name)} />
            </FormField>
            <FormField id="plugin-version" label="Version" error={errors.version}>
              <input id="plugin-version" className="input" placeholder="1.0.0" value={form.version} onChange={(event) => setField('version', event.target.value)} {...errorProps('plugin-version', errors.version)} />
            </FormField>
          </div>
          <SlugField id="plugin-slug" source={form.name} value={form.slug} locked={Boolean(plugin)} error={errors.slug} onChange={(slug) => setField('slug', slug)} />
          <FormField id="plugin-category" label="Category" hint={MISSING_HINT} error={errors.category}>
            <MasterSelect id="plugin-category" list={categories} value={form.category} error={errors.category} onChange={(value) => setField('category', value)} />
          </FormField>
          <FormField id="plugin-purpose" label="Description (optional)">
            <textarea id="plugin-purpose" className="input h-auto py-2" rows={2} value={form.purpose} onChange={(event) => setField('purpose', event.target.value)} />
          </FormField>
        </section>

        <section className="mb-2 border-t border-slate-200 pt-4">
          <h3 className={SECTION_HEADING}>How Sentinel runs it</h3>
          <fieldset className="mb-4" aria-describedby={errors.targetTypes ? 'plugin-targets-error' : undefined}>
            <legend className="mb-1.5 font-medium">Target types</legend>
            <div className="grid grid-cols-2 gap-2">
              {targetTypes.items.map((type) => (
                <label key={type.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 has-checked:border-blue-600 has-checked:bg-blue-50">
                  <input type="checkbox" checked={form.targetTypes.includes(type.id)} onChange={() => toggleTargetType(type.id)} />
                  <span className="text-[13px]">{type.name}</span>
                </label>
              ))}
            </div>
            {errors.targetTypes && (
              <p id="plugin-targets-error" className="mt-1.5 text-[13px] text-red-700">
                {errors.targetTypes}
              </p>
            )}
          </fieldset>
          <FormField id="plugin-interface" label="Interface" hint={pluginInterface?.description} error={errors.interface}>
            <MasterSelect id="plugin-interface" list={interfaces} value={form.interface} error={errors.interface} onChange={(value) => setField('interface', value)} />
          </FormField>
          <FormField
            id="plugin-command"
            label={asksForUrl ? 'Endpoint URL' : 'Command'}
            hint={asksForUrl ? 'Sentinel sends the target to this endpoint.' : 'Use {target} where the scan target goes.'}
            error={errors.command}
          >
            <input
              id="plugin-command"
              className="input font-mono text-[13px]"
              placeholder={asksForUrl ? 'https://scanner.internal.example/v1/scan' : 'tool scan --format json {target}'}
              value={form.command}
              onChange={(event) => setField('command', event.target.value)}
              {...errorProps('plugin-command', errors.command)}
            />
          </FormField>
          <FormField id="plugin-image" label="Container image" hint="Each scan runs in an isolated container." error={errors.image}>
            <input
              id="plugin-image"
              className="input font-mono text-[13px]"
              placeholder="registry.example.com/team/tool"
              value={form.image}
              onChange={(event) => setField('image', event.target.value)}
              {...errorProps('plugin-image', errors.image)}
            />
          </FormField>
        </section>

        <section className="border-t border-slate-200 pt-4">
          <h3 className={SECTION_HEADING}>Status</h3>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <FormField id="plugin-license" label="License" error={errors.license}>
              <MasterSelect id="plugin-license" list={licenses} value={form.license} error={errors.license} onChange={(value) => setField('license', value)} />
            </FormField>
            <FormField id="plugin-status" label="Integration status" error={errors.integrationStatus}>
              <MasterSelect id="plugin-status" list={statuses} value={form.integrationStatus} error={errors.integrationStatus} onChange={(value) => setField('integrationStatus', value)} />
            </FormField>
          </div>
          <label className="mb-4 flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={form.enabled} onChange={(event) => setField('enabled', event.target.checked)} />
            <span>Enabled — organizations can choose this plugin when they start a scan</span>
          </label>
        </section>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : plugin ? 'Save changes' : 'Register plugin'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
