import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPermission, updatePermission } from '../features/admin/adminThunks';
import { showToast } from '../features/ui/uiSlice';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import SlugField from './SlugField';
import { slugError } from '../utils/slug';

// One form for both create and edit. `permission` is set when editing; its module is then fixed.
export default function PermissionFormModal({ permission, module, onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    module: module.key,
    name: permission?.name ?? '',
    // Only the part after "<module>." is typed; the module slug is added in front.
    slug: permission ? permission.key.slice(permission.key.indexOf('.') + 1) : '',
    description: permission?.description ?? '',
  });
  const [error, setError] = useState('');
  const [slugProblem, setSlugProblem] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    if (form.name.trim().length < 2) {
      setError('Enter a permission name (at least 2 characters).');
      return;
    }
    if (!permission && slugError(form.slug)) {
      setSlugProblem(slugError(form.slug));
      return;
    }
    setIsSaving(true);
    try {
      const saved = permission
        ? await dispatch(updatePermission({ key: permission.key, changes: form })).unwrap()
        : await dispatch(createPermission(form)).unwrap();
      dispatch(showToast({ message: `Permission "${saved.name}" ${permission ? 'updated' : 'created'}.` }));
      onClose();
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  }

  return (
    <Modal title={permission ? `Edit permission · ${module.name}` : `New permission · ${module.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="permission-name" label="Name" hint="For example: Create user, Export report." error={error}>
          <input
            id="permission-name"
            className="input"
            value={form.name}
            autoFocus
            onChange={(event) => {
              setForm({ ...form, name: event.target.value });
              setError('');
            }}
            {...errorProps('permission-name', error)}
          />
        </FormField>
        <SlugField
          id="permission-slug"
          source={form.name}
          value={form.slug}
          prefix={`${permission ? permission.key.slice(0, permission.key.indexOf('.')) : module.key}.`}
          locked={Boolean(permission)}
          error={slugProblem}
          onChange={(slug) => {
            setForm((current) => ({ ...current, slug }));
            setSlugProblem('');
          }}
        />
        <FormField id="permission-description" label="Description (optional)">
          <textarea
            id="permission-description"
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
            {isSaving ? 'Saving…' : permission ? 'Save changes' : 'Create permission'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
