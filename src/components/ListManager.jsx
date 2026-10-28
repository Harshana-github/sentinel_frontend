import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectMasterList } from '../features/masters/mastersSlice';
import { createMasterItem, deleteMasterItem, fetchMasterItems, updateMasterItem } from '../features/masters/mastersThunks';
import { showToast } from '../features/ui/uiSlice';
import { useTranslation } from '../i18n';
import { slugError } from '../utils/slug';
import AsyncContent from './AsyncContent';
import BilingualFields from './BilingualFields';
import Card from './Card';
import { useConfirm } from './ConfirmDialog';
import DataTable from './DataTable';
import FormField from './FormField';
import Modal from './Modal';
import SlugField from './SlugField';
import { ToneBadge } from './StatusBadge';

// `usage` is { plugins, targets, organizations, users, … } counts from the API.
function usageText(usage = {}, t) {
  const parts = Object.entries(usage)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => t(`masters.usage.${key}`, { count }));
  return parts.length ? parts.join(t('masters.usage.separator')) : t('masters.usage.none');
}

const isInUse = (item) => Object.values(item.usage ?? {}).some((count) => count > 0);

// One form for both create and edit. `item` is set when editing.
function MasterItemFormModal({ list, text, item, onClose }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const extraFields = list.extraFields ?? [];
  const [form, setForm] = useState(() => ({
    name: item?.name ?? '',
    nameJa: item?.nameJa ?? '',
    slug: item?.id ?? '',
    description: item?.description ?? '',
    descriptionJa: item?.descriptionJa ?? '',
    ...Object.fromEntries(extraFields.map((field) => [field.key, item?.[field.key] ?? field.options?.[0] ?? ''])),
  }));
  const [error, setError] = useState('');
  const [slugProblem, setSlugProblem] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    if (form.name.trim().length < 2) {
      setError(t('bilingual.nameRequired'));
      return;
    }
    if (!item && slugError(form.slug)) {
      setSlugProblem(t(slugError(form.slug)));
      return;
    }
    setIsSaving(true);
    try {
      const saved = item
        ? await dispatch(updateMasterItem({ list: list.key, id: item.id, changes: form })).unwrap()
        : await dispatch(createMasterItem({ list: list.key, item: form })).unwrap();
      dispatch(showToast({ message: t(item ? 'common.updatedToast' : 'common.createdToast', { name: saved.name }) }));
      onClose();
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  }

  return (
    <Modal title={t(item ? 'masters.editItem' : 'masters.newItem', { item: text('singular') })} size="lg" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <BilingualFields
          id="master"
          form={form}
          nameError={error}
          nameHint={text('nameHint')}
          onChange={(field, value) => {
            setForm((current) => ({ ...current, [field]: value }));
            if (field === 'name') setError('');
          }}
        />
        <SlugField
          id="master-slug"
          source={form.name}
          value={form.slug}
          locked={Boolean(item)}
          error={slugProblem}
          onChange={(slug) => {
            setForm((current) => ({ ...current, slug }));
            setSlugProblem('');
          }}
        />
        {extraFields.map((field) => {
          const id = `master-${field.key}`;
          const props = {
            id,
            className: 'input',
            value: form[field.key],
            onChange: (event) => setForm({ ...form, [field.key]: event.target.value }),
          };
          return (
            <FormField key={field.key} id={id} label={t(`masters.fields.${field.key}.label`)} hint={t(`masters.fields.${field.key}.hint`)}>
              {field.options ? (
                <select {...props}>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {t(`masters.fields.${field.key}.options.${option}`)}
                    </option>
                  ))}
                </select>
              ) : (
                <input {...props} />
              )}
            </FormField>
          );
        })}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? t('common.saving') : item ? t('common.saveChanges') : t('masters.add', { item: text('singular') })}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Add, edit and delete the items of one list (a master data list or a status category).
// `list` is an entry of MASTER_LISTS or STATUS_CATEGORIES; `textKey` is where its texts are
// in the translations, e.g. 'masters.lists.target-types' with title, singular, description, nameHint.
export default function ListManager({ list, textKey }) {
  const dispatch = useDispatch();
  const { t, localName } = useTranslation();
  const confirm = useConfirm();
  const { items, status, error } = useSelector((state) => selectMasterList(state, list.key));
  // undefined = closed, null = creating, an item = editing.
  const [editing, setEditing] = useState();
  const text = (field) => t(`${textKey}.${field}`);

  // Always reload, so the usage counts are current.
  useEffect(() => {
    dispatch(fetchMasterItems(list.key));
  }, [dispatch, list.key]);

  async function handleDelete(item) {
    const confirmed = await confirm({
      title: t('masters.deleteTitle'),
      message: t('masters.deleteMessage', { name: localName(item) }),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!confirmed) return;
    try {
      await dispatch(deleteMasterItem({ list: list.key, id: item.id })).unwrap();
      dispatch(showToast({ message: t('common.deletedToast', { name: localName(item) }) }));
    } catch (deleteError) {
      dispatch(showToast({ type: 'error', message: deleteError.message }));
    }
  }

  const columns = [
    {
      key: 'name',
      header: t('common.name'),
      render: (item) => (
        <div className="flex min-w-48 flex-col gap-0.5">
          <span className="font-semibold">
            {localName(item)}
            {item.builtIn && (
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">{t('masters.system')}</span>
            )}
          </span>
          <span className="text-xs text-slate-500">{localName(item, 'description') || t('common.noDescription')}</span>
        </div>
      ),
    },
    { key: 'slug', header: t('slug.label'), render: (item) => <code className="text-xs whitespace-nowrap text-slate-500">{item.id}</code> },
    ...(list.extraFields ?? []).map((field) => ({
      key: field.key,
      header: t(`masters.fields.${field.key}.label`),
      render: (item) => {
        if (field.key === 'tone') return <ToneBadge label={localName(item)} tone={item.tone} />;
        if (field.options) return <span className="text-slate-600">{t(`masters.fields.${field.key}.options.${item[field.key]}`)}</span>;
        return <span className="font-mono text-xs text-slate-600">{item[field.key] || '—'}</span>;
      },
    })),
    {
      key: 'usage',
      header: t('masters.usedBy'),
      render: (item) => <span className="whitespace-nowrap text-slate-500">{usageText(item.usage, t)}</span>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'w-28 text-right',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            className="icon-btn"
            aria-label={t('common.editItem', { name: localName(item) })}
            title={t('common.edit')}
            onClick={() => setEditing(item)}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={t('common.deleteItem', { name: localName(item) })}
            title={item.builtIn ? t('masters.builtInLocked') : isInUse(item) ? t('masters.inUse') : t('common.delete')}
            disabled={item.builtIn || isInUse(item)}
            onClick={() => handleDelete(item)}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Card
      title={`${text('title')} (${items.length})`}
      actions={
        // Fixed categories hold exactly the statuses Sentinel uses, so nothing can be added.
        !list.fixed && (
          <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
            <Plus size={16} aria-hidden="true" />
            {t('masters.add', { item: text('singular') })}
          </button>
        )
      }
      flush
      fill
    >
      <p className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-2.5 text-xs text-slate-500">
        <span>
          {text('description')}
          {list.fixed && ` ${t('statuses.fixedNote')}`}
        </span>
        <span>
          {t('slug.label')} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{list.key}</code>
        </span>
      </p>
      <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchMasterItems(list.key))}>
        <DataTable columns={columns} rows={items} caption={text('title')} />
      </AsyncContent>
      {editing !== undefined && <MasterItemFormModal list={list} text={text} item={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </Card>
  );
}
