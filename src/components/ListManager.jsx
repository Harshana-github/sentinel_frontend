import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectMasterList } from '../features/masters/mastersSlice';
import { createMasterItem, deleteMasterItem, fetchMasterItems, updateMasterItem } from '../features/masters/mastersThunks';
import { showToast } from '../features/ui/uiSlice';
import AsyncContent from './AsyncContent';
import Card from './Card';
import DataTable from './DataTable';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import SlugField from './SlugField';
import { ToneBadge } from './StatusBadge';
import { slugError } from '../utils/slug';

const USAGE_NOUNS = { plugins: 'plugin', targets: 'target', organizations: 'organization', users: 'user' };

// `usage` is { plugins, targets, organizations, users } counts from the API.
function usageText(usage = {}) {
  const parts = Object.entries(usage)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${USAGE_NOUNS[key]}${count === 1 ? '' : 's'}`);
  return parts.length ? parts.join(', ') : 'Not used';
}

const isInUse = (item) => Object.values(item.usage ?? {}).some((count) => count > 0);

// One form for both create and edit. `item` is set when editing.
function MasterItemFormModal({ list, item, onClose }) {
  const dispatch = useDispatch();
  const extraFields = list.extraFields ?? [];
  const [form, setForm] = useState(() => ({
    name: item?.name ?? '',
    slug: item?.id ?? '',
    description: item?.description ?? '',
    ...Object.fromEntries(extraFields.map((field) => [field.key, item?.[field.key] ?? field.options?.[0].value ?? ''])),
  }));
  const [error, setError] = useState('');
  const [slugProblem, setSlugProblem] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    if (form.name.trim().length < 2) {
      setError('Enter a name (at least 2 characters).');
      return;
    }
    if (!item && slugError(form.slug)) {
      setSlugProblem(slugError(form.slug));
      return;
    }
    setIsSaving(true);
    try {
      const saved = item
        ? await dispatch(updateMasterItem({ list: list.key, id: item.id, changes: form })).unwrap()
        : await dispatch(createMasterItem({ list: list.key, item: form })).unwrap();
      dispatch(showToast({ message: `${saved.name} ${item ? 'updated' : 'added'}.` }));
      onClose();
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  }

  return (
    <Modal title={item ? `Edit ${list.singular}` : `New ${list.singular}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="master-name" label="Name" hint={list.nameHint} error={error}>
          <input
            id="master-name"
            className="input"
            value={form.name}
            autoFocus
            onChange={(event) => {
              setForm({ ...form, name: event.target.value });
              setError('');
            }}
            {...errorProps('master-name', error)}
          />
        </FormField>
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
        <FormField id="master-description" label="Description (optional)">
          <input id="master-description" className="input" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </FormField>
        {extraFields.map((field) => (
          <FormField key={field.key} id={`master-${field.key}`} label={field.label} hint={field.hint}>
            {field.options ? (
              <select id={`master-${field.key}`} className="input" value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input id={`master-${field.key}`} className="input" value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />
            )}
          </FormField>
        ))}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : item ? 'Save changes' : `Add ${list.singular}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Add, edit and delete the items of one list (a master data list or a status category).
// `list` is an entry of MASTER_LISTS or STATUS_CATEGORIES.
export default function ListManager({ list }) {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => selectMasterList(state, list.key));
  // undefined = closed, null = creating, an item = editing.
  const [editing, setEditing] = useState();

  // Always reload, so the usage counts are current.
  useEffect(() => {
    dispatch(fetchMasterItems(list.key));
  }, [dispatch, list.key]);

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await dispatch(deleteMasterItem({ list: list.key, id: item.id })).unwrap();
      dispatch(showToast({ message: `${item.name} deleted.` }));
    } catch (deleteError) {
      dispatch(showToast({ type: 'error', message: deleteError.message }));
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex min-w-48 flex-col gap-0.5">
          <span className="font-semibold">
            {item.name}
            {item.builtIn && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">System</span>}
          </span>
          <span className="text-xs text-slate-500">{item.description || 'No description.'}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (item) => <code className="text-xs whitespace-nowrap text-slate-500">{item.id}</code>,
    },
    ...(list.extraFields ?? []).map((field) => ({
      key: field.key,
      header: field.label,
      render: (item) => {
        if (field.key === 'tone') return <ToneBadge label={item.name} tone={item.tone} />;
        const value = field.options ? field.options.find((option) => option.value === item[field.key])?.label : item[field.key];
        return <span className={field.options ? 'text-slate-600' : 'font-mono text-xs text-slate-600'}>{value || '—'}</span>;
      },
    })),
    {
      key: 'usage',
      header: 'Used by',
      render: (item) => <span className="whitespace-nowrap text-slate-500">{usageText(item.usage)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-28 text-right',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <button type="button" className="icon-btn" aria-label={`Edit ${item.name}`} title="Edit" onClick={() => setEditing(item)}>
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Delete ${item.name}`}
            title={item.builtIn ? 'Used by Sentinel itself, so it cannot be deleted' : isInUse(item) ? 'In use, so it cannot be deleted' : 'Delete'}
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
      title={`${list.title} (${items.length})`}
      actions={
        <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
          <Plus size={16} aria-hidden="true" />
          Add {list.singular}
        </button>
      }
      flush
      fill
    >
      <p className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-2.5 text-xs text-slate-500">
        <span>{list.description}</span>
        <span>
          Slug <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{list.key}</code>
        </span>
      </p>
      <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchMasterItems(list.key))}>
        <DataTable columns={columns} rows={items} caption={list.title} emptyMessage={`No ${list.title.toLowerCase()} yet.`} />
      </AsyncContent>
      {editing !== undefined && <MasterItemFormModal list={list} item={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </Card>
  );
}
