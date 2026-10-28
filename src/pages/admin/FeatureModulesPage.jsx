import { useEffect, useState } from 'react';
import { LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectModules, selectPermissions } from '../../features/admin/adminSlice';
import { createModule, deletePermission, deleteModule, fetchModules, fetchPermissions, updateModule } from '../../features/admin/adminThunks';
import { showToast } from '../../features/ui/uiSlice';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import FormField, { errorProps } from '../../components/FormField';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import PermissionFormModal from '../../components/PermissionFormModal';
import SlugField from '../../components/SlugField';
import { slugError } from '../../utils/slug';

// One form for both create and edit. `module` is set when editing.
function ModuleFormModal({ module, onClose, onSaved }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: module?.name ?? '', slug: module?.key ?? '', description: module?.description ?? '' });
  const [error, setError] = useState('');
  const [slugProblem, setSlugProblem] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    if (form.name.trim().length < 2) {
      setError('Enter a module name (at least 2 characters).');
      return;
    }
    if (!module && slugError(form.slug)) {
      setSlugProblem(slugError(form.slug));
      return;
    }
    setIsSaving(true);
    try {
      const saved = module ? await dispatch(updateModule({ key: module.key, changes: form })).unwrap() : await dispatch(createModule(form)).unwrap();
      dispatch(showToast({ message: `Module "${saved.name}" ${module ? 'updated' : 'created'}.` }));
      onSaved?.(saved);
      onClose();
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  }

  return (
    <Modal title={module ? 'Edit module' : 'New module'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="module-name" label="Name" error={error}>
          <input
            id="module-name"
            className="input"
            value={form.name}
            autoFocus
            onChange={(event) => {
              setForm({ ...form, name: event.target.value });
              setError('');
            }}
            {...errorProps('module-name', error)}
          />
        </FormField>
        <SlugField
          id="module-slug"
          source={form.name}
          value={form.slug}
          locked={Boolean(module)}
          error={slugProblem}
          onChange={(slug) => {
            setForm((current) => ({ ...current, slug }));
            setSlugProblem('');
          }}
        />
        <FormField id="module-description" label="Description (optional)">
          <textarea
            id="module-description"
            className="input h-auto py-2"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : module ? 'Save changes' : 'Create module'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const SYSTEM_TAG = 'ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500';

export default function FeatureModulesPage() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector(selectModules);
  const { items: permissions } = useSelector(selectPermissions);
  const [selectedKey, setSelectedKey] = useState(null);
  // undefined = closed, null = creating, a module = editing.
  const [editingModule, setEditingModule] = useState();
  // { module, permission } when open; permission is undefined when adding.
  const [permissionForm, setPermissionForm] = useState(null);

  useEffect(() => {
    dispatch(fetchModules());
    dispatch(fetchPermissions());
  }, [dispatch]);

  // Falls back to the first module, also after the selected one is deleted.
  const selected = items.find((module) => module.key === selectedKey) ?? items[0];
  const permissionsOf = (key) => permissions.filter((permission) => permission.module === key);

  async function handleDeleteModule(module) {
    if (!window.confirm(`Delete the "${module.name}" module and its permissions? This cannot be undone.`)) return;
    try {
      await dispatch(deleteModule(module.key)).unwrap();
      dispatch(showToast({ message: `Module "${module.name}" deleted.` }));
    } catch (deleteError) {
      dispatch(showToast({ type: 'error', message: deleteError.message }));
    }
  }

  async function handleDeletePermission(permission) {
    if (!window.confirm(`Delete the "${permission.name}" permission? This cannot be undone.`)) return;
    try {
      await dispatch(deletePermission(permission.key)).unwrap();
      dispatch(showToast({ message: `Permission "${permission.name}" deleted.` }));
    } catch (deleteError) {
      dispatch(showToast({ type: 'error', message: deleteError.message }));
    }
  }

  const permissionColumns = [
    {
      key: 'name',
      header: 'Permission',
      render: (permission) => (
        <div className="flex min-w-48 flex-col gap-0.5">
          <span className="font-semibold">
            {permission.name}
            {permission.builtIn && <span className={SYSTEM_TAG}>System</span>}
          </span>
          <span className="text-xs text-slate-500">{permission.description || 'No description.'}</span>
        </div>
      ),
    },
    {
      key: 'key',
      header: 'Key',
      render: (permission) => <code className="text-xs whitespace-nowrap text-slate-500">{permission.key}</code>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-28 text-right',
      render: (permission) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            className="icon-btn"
            aria-label={`Edit ${permission.name}`}
            title="Edit"
            onClick={() => setPermissionForm({ module: selected, permission })}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Delete ${permission.name}`}
            title={permission.builtIn ? 'Used by Sentinel itself, so it cannot be deleted' : 'Delete'}
            disabled={permission.builtIn}
            onClick={() => handleDeletePermission(permission)}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  const selectedPermissions = selected ? permissionsOf(selected.key).map((permission) => ({ ...permission, id: permission.key })) : [];

  return (
    <div className="fill-page">
      <PageHeader
        title="Modules & permissions"
        description="Each module of the user panel has its own permissions. The Admin role of every organization automatically gets all of them."
      />

      <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchModules())}>
        <div className="fill-grow grid gap-5 lg:grid-cols-[240px_1fr] lg:grid-rows-[minmax(0,1fr)]">
          <nav aria-label="Modules" className="self-start rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:max-h-full lg:overflow-y-auto">
            <div className="flex items-center justify-between px-2.5 pt-1 pb-2">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Modules</p>
              <button type="button" className="icon-btn size-7" aria-label="New module" title="New module" onClick={() => setEditingModule(null)}>
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            <ul className="flex flex-col gap-0.5">
              {items.map((module) => {
                const isSelected = module.key === selected?.key;
                return (
                  <li key={module.key}>
                    <button
                      type="button"
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => setSelectedKey(module.key)}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${isSelected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <LayoutGrid size={16} aria-hidden="true" />
                      <span className="flex-1 truncate">{module.name}</span>
                      <span
                        className={`rounded-full px-1.5 text-[11px] font-semibold ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {permissionsOf(module.key).length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {selected && (
            <Card
              title={`${selected.name} permissions (${selectedPermissions.length})`}
              actions={
                <div className="flex items-center gap-1">
                  <button type="button" className="btn btn-primary" onClick={() => setPermissionForm({ module: selected })}>
                    <Plus size={16} aria-hidden="true" />
                    Add permission
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Edit module ${selected.name}`}
                    title="Edit module"
                    onClick={() => setEditingModule(selected)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Delete module ${selected.name}`}
                    title={selected.builtIn ? 'Used by Sentinel itself, so it cannot be deleted' : 'Delete module'}
                    disabled={selected.builtIn}
                    onClick={() => handleDeleteModule(selected)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              }
              flush
              fill
            >
              <p className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-2.5 text-xs text-slate-500">
                <span>
                  {selected.description || 'No description.'}
                  {selected.builtIn && <span className={SYSTEM_TAG}>System module</span>}
                </span>
                <span>
                  Slug <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{selected.key}</code>
                </span>
              </p>
              <DataTable
                columns={permissionColumns}
                rows={selectedPermissions}
                caption={`${selected.name} permissions`}
                emptyMessage="No permissions yet. Use Add permission."
              />
            </Card>
          )}
        </div>
      </AsyncContent>

      {editingModule !== undefined && (
        <ModuleFormModal
          module={editingModule ?? undefined}
          onSaved={(saved) => setSelectedKey(saved.key)}
          onClose={() => setEditingModule(undefined)}
        />
      )}
      {permissionForm && (
        <PermissionFormModal permission={permissionForm.permission} module={permissionForm.module} onClose={() => setPermissionForm(null)} />
      )}
    </div>
  );
}
