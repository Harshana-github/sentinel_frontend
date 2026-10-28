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
import { useTranslation } from '../i18n';

const SECTION_HEADING = 'mb-3 text-[13px] font-semibold tracking-wide text-slate-500 uppercase';

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

function validate(form, pluginInterface, isNew, t) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = t('plugins.errors.name');
  if (isNew && slugError(form.slug)) errors.slug = t(slugError(form.slug));
  if (!form.version.trim()) errors.version = t('plugins.errors.version');
  if (!form.source) errors.source = t('plugins.errors.choose');
  if (!form.category) errors.category = t('plugins.errors.choose');
  if (form.targetTypes.length === 0) errors.targetTypes = t('plugins.errors.targetTypes');
  if (!form.interface) errors.interface = t('plugins.errors.choose');
  if (pluginInterface?.kind === 'command' && !form.command.includes('{target}')) errors.command = t('plugins.errors.command');
  if (pluginInterface?.kind === 'url' && !/^https?:\/\//.test(form.command.trim())) errors.command = t('plugins.errors.endpoint');
  if (!form.image.trim()) errors.image = t('plugins.errors.image');
  if (!form.license) errors.license = t('plugins.errors.choose');
  if (!form.integrationStatus) errors.integrationStatus = t('plugins.errors.choose');
  return errors;
}

// A <select> filled from a master data list.
function MasterSelect({ id, list, value, error, onChange }) {
  const { t } = useTranslation();
  return (
    <select id={id} className="input" value={value} onChange={(event) => onChange(event.target.value)} {...errorProps(id, error)}>
      <option value="">{list.status === 'loading' ? t('common.loading') : t('common.selectPlaceholder')}</option>
      {list.items.map((item) => (
        <option key={item.id} value={item.id}>
          {list.nameOf(item.id)}
        </option>
      ))}
    </select>
  );
}

// Register a new plugin, or edit one when `plugin` is set. Every choice comes from master data.
export default function PluginFormModal({ plugin, onClose }) {
  const dispatch = useDispatch();
  const { t, localName } = useTranslation();
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
    const validationErrors = validate(form, pluginInterface, !plugin, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setSubmitError('');
    try {
      const saved = plugin
        ? await dispatch(updateScannerModule({ id: plugin.id, changes: form })).unwrap()
        : await dispatch(registerScannerModule(form)).unwrap();
      dispatch(showToast({ message: t(plugin ? 'common.updatedToast' : 'plugins.registeredToast', { name: saved.name }) }));
      onClose();
    } catch (saveError) {
      setSubmitError(saveError.message);
      setIsSaving(false);
    }
  }

  const asksForUrl = pluginInterface?.kind === 'url';

  return (
    <Modal title={plugin ? t('common.editItem', { name: plugin.name }) : t('plugins.registerTitle')} size="lg" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        <section className="mb-2">
          <h3 className={SECTION_HEADING}>{t('plugins.sectionTool')}</h3>
          <fieldset className="mb-4" aria-describedby={errors.source ? 'plugin-source-error' : undefined}>
            <legend className="mb-1.5 font-medium">{t('plugins.source')}</legend>
            {sources.status === 'loading' && <p className="text-[13px] text-slate-500">{t('common.loading')}</p>}
            {sources.status === 'succeeded' && sources.items.length === 0 && <p className="text-[13px] text-slate-500">{t('plugins.missingHint')}</p>}
            <div className="grid grid-cols-2 gap-2">
              {sources.items.map((source) => (
                <label
                  key={source.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2.5 has-checked:border-blue-600 has-checked:bg-blue-50"
                >
                  <input
                    className="mt-1"
                    type="radio"
                    name="source"
                    checked={form.source === source.id}
                    onChange={() => setField('source', source.id)}
                  />
                  <span className="flex flex-col">
                    <strong>{localName(source)}</strong>
                    {source.description && <span className="text-xs text-slate-500">{localName(source, 'description')}</span>}
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
            <FormField id="plugin-name" label={t('common.name')} required error={errors.name}>
              <input
                id="plugin-name"
                className="input"
                value={form.name}
                autoFocus
                onChange={(event) => setField('name', event.target.value)}
                {...errorProps('plugin-name', errors.name)}
              />
            </FormField>
            <FormField id="plugin-version" label={t('plugins.version')} required error={errors.version}>
              <input
                id="plugin-version"
                className="input"
                placeholder="1.0.0"
                value={form.version}
                onChange={(event) => setField('version', event.target.value)}
                {...errorProps('plugin-version', errors.version)}
              />
            </FormField>
          </div>
          <SlugField
            id="plugin-slug"
            source={form.name}
            value={form.slug}
            locked={Boolean(plugin)}
            error={errors.slug}
            onChange={(slug) => setField('slug', slug)}
          />
          <FormField id="plugin-category" label={t('plugins.category')} required hint={t('plugins.missingHint')} error={errors.category}>
            <MasterSelect
              id="plugin-category"
              list={categories}
              value={form.category}
              error={errors.category}
              onChange={(value) => setField('category', value)}
            />
          </FormField>
          <FormField id="plugin-purpose" label={t('common.description')} optional>
            <textarea
              id="plugin-purpose"
              className="input h-auto py-2"
              rows={2}
              value={form.purpose}
              onChange={(event) => setField('purpose', event.target.value)}
            />
          </FormField>
        </section>

        <section className="mb-2 border-t border-slate-200 pt-4">
          <h3 className={SECTION_HEADING}>{t('plugins.sectionRun')}</h3>
          <fieldset className="mb-4" aria-describedby={errors.targetTypes ? 'plugin-targets-error' : undefined}>
            <legend className="mb-1.5 font-medium">{t('plugins.targetTypes')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {targetTypes.items.map((type) => (
                <label
                  key={type.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 has-checked:border-blue-600 has-checked:bg-blue-50"
                >
                  <input type="checkbox" checked={form.targetTypes.includes(type.id)} onChange={() => toggleTargetType(type.id)} />
                  <span className="text-[13px]">{localName(type)}</span>
                </label>
              ))}
            </div>
            {errors.targetTypes && (
              <p id="plugin-targets-error" className="mt-1.5 text-[13px] text-red-700">
                {errors.targetTypes}
              </p>
            )}
          </fieldset>
          <FormField
            id="plugin-interface"
            label={t('plugins.interface')}
            required
            hint={localName(pluginInterface, 'description')}
            error={errors.interface}
          >
            <MasterSelect
              id="plugin-interface"
              list={interfaces}
              value={form.interface}
              error={errors.interface}
              onChange={(value) => setField('interface', value)}
            />
          </FormField>
          <FormField
            id="plugin-command"
            label={asksForUrl ? t('plugins.endpoint') : t('plugins.command')}
            required
            hint={asksForUrl ? t('plugins.endpointHint') : t('plugins.commandHint')}
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
          <FormField id="plugin-image" label={t('plugins.image')} required hint={t('plugins.imageHint')} error={errors.image}>
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
          <h3 className={SECTION_HEADING}>{t('common.status')}</h3>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <FormField id="plugin-license" label={t('plugins.license')} required error={errors.license}>
              <MasterSelect
                id="plugin-license"
                list={licenses}
                value={form.license}
                error={errors.license}
                onChange={(value) => setField('license', value)}
              />
            </FormField>
            <FormField id="plugin-status" label={t('plugins.integrationStatus')} required error={errors.integrationStatus}>
              <MasterSelect
                id="plugin-status"
                list={statuses}
                value={form.integrationStatus}
                error={errors.integrationStatus}
                onChange={(value) => setField('integrationStatus', value)}
              />
            </FormField>
          </div>
          <label className="mb-4 flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={form.enabled} onChange={(event) => setField('enabled', event.target.checked)} />
            <span>{t('plugins.enabledHelp')}</span>
          </label>
        </section>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? t('common.saving') : plugin ? t('common.saveChanges') : t('plugins.register')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
