import { useEffect, useState } from 'react';
import { Lock, Pencil, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectRolesState } from '../../features/roles/rolesSlice';
import { createRole, deleteRole, fetchPermissionCatalog, fetchRoles, updateRole } from '../../features/roles/rolesThunks';
import { showToast } from '../../features/ui/uiSlice';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import FormField, { errorProps } from '../../components/FormField';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import SlugField from '../../components/SlugField';
import { EmptyState } from '../../components/StateMessage';
import { can } from '../../utils/roles';
import { slugError } from '../../utils/slug';
import { useConfirm } from '../../components/ConfirmDialog';
import { useTranslation } from '../../i18n';

const SYSTEM_TAG = 'rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500';

// Name, slug and description. Permissions are chosen on the page, next to the role.
function RoleFormModal({ role, onClose, onSaved }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: role?.name ?? '', slug: role?.slug ?? '', description: role?.description ?? '' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    const validationErrors = {};
    if (form.name.trim().length < 2) validationErrors.name = t('roles.nameRequired');
    if (!role && slugError(form.slug)) validationErrors.slug = t(slugError(form.slug));
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    try {
      const saved = role
        ? await dispatch(updateRole({ id: role.id, changes: { name: form.name, description: form.description } })).unwrap()
        : await dispatch(createRole({ ...form, permissions: [] })).unwrap();
      dispatch(showToast({ message: role ? t('common.updatedToast', { name: saved.name }) : t('roles.created', { name: saved.name }) }));
      onSaved(saved);
      onClose();
    } catch (saveError) {
      setErrors({ name: saveError.message });
      setIsSaving(false);
    }
  }

  return (
    <Modal title={role ? t('roles.edit') : t('roles.new')} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="role-name" label={t('common.name')} required hint={t('roles.nameHint')} error={errors.name}>
          <input
            id="role-name"
            className="input"
            value={form.name}
            autoFocus
            onChange={(event) => {
              setForm({ ...form, name: event.target.value });
              setErrors({ ...errors, name: undefined });
            }}
            {...errorProps('role-name', errors.name)}
          />
        </FormField>
        <SlugField
          id="role-slug"
          source={form.name}
          value={form.slug}
          locked={Boolean(role)}
          error={errors.slug}
          onChange={(slug) => {
            setForm((current) => ({ ...current, slug }));
            setErrors((current) => ({ ...current, slug: undefined }));
          }}
        />
        <FormField id="role-description" label={t('common.description')} optional>
          <textarea
            id="role-description"
            className="input h-auto py-2"
            rows={2}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? t('common.saving') : role ? t('common.saveChanges') : t('roles.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// The selected role's permissions, grouped by module. Rendered with key={role.id}, so the
// draft starts fresh for each role. The Admin role is shown fully selected and locked.
function RolePermissions({ role, catalog, canEdit }) {
  const dispatch = useDispatch();
  const { t, localName } = useTranslation();
  const [draft, setDraft] = useState(() => new Set(role.permissions));
  const [isSaving, setIsSaving] = useState(false);
  const locked = role.system || !canEdit;
  const isSelected = (key) => role.system || draft.has(key);
  const isDirty = !role.system && (draft.size !== role.permissions.length || role.permissions.some((key) => !draft.has(key)));

  function toggle(keys, selected) {
    setDraft((current) => {
      const next = new Set(current);
      keys.forEach((key) => (selected ? next.add(key) : next.delete(key)));
      return next;
    });
  }

  async function save() {
    setIsSaving(true);
    try {
      await dispatch(updateRole({ id: role.id, changes: { permissions: [...draft] } })).unwrap();
      dispatch(showToast({ message: t('roles.permissionsSaved', { name: role.name }) }));
    } catch (saveError) {
      dispatch(showToast({ type: 'error', message: saveError.message }));
    } finally {
      setIsSaving(false);
    }
  }

  const total = catalog.permissions.length;
  const selectedCount = role.system ? total : catalog.permissions.filter((permission) => draft.has(permission.key)).length;

  return (
    <>
      <div className="fill-scroll flex flex-col gap-4 bg-slate-50/60 p-4">
        {role.system && (
          <p className="flex items-center gap-2 rounded-md border border-slate-200 bg-surface px-3 py-2 text-[13px] text-slate-600">
            <Lock size={14} aria-hidden="true" className="shrink-0 text-slate-400" />
            {t('roles.adminNotice')}
          </p>
        )}

        {catalog.modules.map((module) => {
          const permissions = catalog.permissions.filter((permission) => permission.module === module.key);
          if (permissions.length === 0) return null;
          const keys = permissions.map((permission) => permission.key);
          const chosen = keys.filter(isSelected).length;
          const allChosen = chosen === keys.length;

          return (
            <section key={module.key} className="rounded-lg border border-slate-200 bg-surface" aria-labelledby={`module-${module.key}`}>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <h3 id={`module-${module.key}`} className="font-semibold">
                    {localName(module)}
                  </h3>
                  {module.description && <p className="truncate text-xs text-slate-500">{localName(module, 'description')}</p>}
                </div>
                <span className="text-xs whitespace-nowrap text-slate-500">{t('roles.chosenOf', { chosen, total: keys.length })}</span>
                <label
                  className={`flex items-center gap-1.5 text-[13px] whitespace-nowrap ${locked ? 'text-slate-400' : 'cursor-pointer text-slate-700'}`}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-blue-600"
                    checked={allChosen}
                    ref={(input) => {
                      if (input) input.indeterminate = chosen > 0 && !allChosen;
                    }}
                    disabled={locked}
                    onChange={() => toggle(keys, !allChosen)}
                  />
                  {t('common.selectAll')}
                </label>
              </header>
              <ul className="grid gap-px bg-slate-100 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <li key={permission.key} className="bg-surface">
                    <label className={`flex h-full items-start gap-2.5 px-4 py-2.5 ${locked ? '' : 'cursor-pointer hover:bg-blue-50/50'}`}>
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-blue-600"
                        checked={isSelected(permission.key)}
                        disabled={locked}
                        onChange={(event) => toggle([permission.key], event.target.checked)}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium">{localName(permission)}</span>
                        {permission.description && <span className="text-xs text-slate-500">{localName(permission, 'description')}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-5 py-3">
        <p className="text-[13px] text-slate-500">
          {t('roles.selectedOf', { selected: selectedCount, total })}
          {isDirty && <span className="ml-2 font-medium text-amber-700">· {t('common.unsavedChanges')}</span>}
        </p>
        {!locked && (
          <div className="ml-auto flex gap-2">
            <button type="button" className="btn btn-secondary" disabled={!isDirty || isSaving} onClick={() => setDraft(new Set(role.permissions))}>
              {t('common.discard')}
            </button>
            <button type="button" className="btn btn-primary" disabled={!isDirty || isSaving} onClick={save}>
              {isSaving ? t('common.saving') : t('roles.savePermissions')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function RolesPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const user = useSelector(selectCurrentUser);
  const { items, status, error, catalog } = useSelector(selectRolesState);
  const [selectedId, setSelectedId] = useState(null);
  // undefined = closed, null = creating, a role = editing.
  const [editing, setEditing] = useState();
  const canView = can(user, 'roles.read');

  useEffect(() => {
    if (!canView) return;
    dispatch(fetchRoles());
    dispatch(fetchPermissionCatalog());
  }, [dispatch, canView]);

  if (!canView) {
    return (
      <>
        <PageHeader title={t('roles.title')} />
        <EmptyState title={t('roles.noPermission')} />
      </>
    );
  }

  // The Admin role first, then the others by name. Falls back to the first role after a delete.
  const sorted = [...items].sort((a, b) => Number(b.system) - Number(a.system) || a.name.localeCompare(b.name));
  const selected = sorted.find((role) => role.id === selectedId) ?? sorted[0];

  async function handleDelete(role) {
    const confirmed = await confirm({
      title: t('roles.deleteTitle'),
      message: t('roles.deleteMessage', { name: role.name }),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!confirmed) return;
    try {
      await dispatch(deleteRole(role.id)).unwrap();
      dispatch(showToast({ message: t('common.deletedToast', { name: role.name }) }));
    } catch (deleteError) {
      dispatch(showToast({ type: 'error', message: deleteError.message }));
    }
  }

  return (
    <div className="fill-page">
      <PageHeader
        title={t('roles.title')}
        description={t('roles.description', { organization: user.organizationName })}
        actions={
          can(user, 'roles.create') && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
              <Plus size={16} aria-hidden="true" />
              {t('roles.new')}
            </button>
          )
        }
      />

      <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchRoles())}>
        <div className="fill-grow grid gap-5 lg:grid-cols-[260px_1fr] lg:grid-rows-[minmax(0,1fr)]">
          <nav
            aria-label={t('roles.title')}
            className="self-start rounded-lg border border-slate-200 bg-surface p-2 shadow-sm lg:max-h-full lg:overflow-y-auto"
          >
            <p className="px-2.5 pt-1 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t('roles.listCount', { count: items.length })}
            </p>
            <ul className="flex flex-col gap-0.5">
              {sorted.map((role) => {
                const isSelected = role.id === selected?.id;
                const Icon = role.system ? ShieldCheck : Users;
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => setSelectedId(role.id)}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${isSelected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <Icon size={16} aria-hidden="true" className="shrink-0" />
                      <span className="flex-1 truncate">{role.name}</span>
                      {role.system ? (
                        <Lock size={13} aria-label={t('roles.systemRole')} className="shrink-0 text-slate-400" />
                      ) : (
                        <span
                          className={`rounded-full px-1.5 text-[11px] font-semibold ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                          title={t('roles.peopleWithRole')}
                        >
                          {role.memberCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {selected && (
            <Card
              title={selected.name}
              flush
              fill
              actions={
                !selected.system && (
                  <div className="flex items-center gap-1">
                    {can(user, 'roles.update') && (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={t('common.editItem', { name: selected.name })}
                        title={t('common.edit')}
                        onClick={() => setEditing(selected)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                    )}
                    {can(user, 'roles.delete') && (
                      <button
                        type="button"
                        className="icon-btn hover:text-red-700"
                        aria-label={t('common.deleteItem', { name: selected.name })}
                        title={selected.memberCount > 0 ? t('roles.inUse') : t('common.delete')}
                        disabled={selected.memberCount > 0}
                        onClick={() => handleDelete(selected)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )
              }
            >
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 px-5 py-2.5 text-xs text-slate-500">
                <span className="min-w-0 flex-1">{selected.description || t('common.noDescription')}</span>
                {selected.system && <span className={SYSTEM_TAG}>{t('roles.systemRole')}</span>}
                <span>{t('roles.peopleCount', { count: selected.memberCount })}</span>
                <span>
                  {t('slug.label')} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{selected.slug}</code>
                </span>
              </p>
              <AsyncContent
                status={catalog.status}
                error={catalog.error}
                hasData={catalog.permissions.length > 0}
                onRetry={() => dispatch(fetchPermissionCatalog())}
              >
                <RolePermissions key={selected.id} role={selected} catalog={catalog} canEdit={can(user, 'roles.update')} />
              </AsyncContent>
            </Card>
          )}
        </div>
      </AsyncContent>

      {editing !== undefined && (
        <RoleFormModal role={editing ?? undefined} onSaved={(saved) => setSelectedId(saved.id)} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
