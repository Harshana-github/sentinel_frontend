import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPermission, updatePermission } from '../features/admin/adminThunks';
import { showToast } from '../features/ui/uiSlice';
import BilingualFields from './BilingualFields';
import Modal from './Modal';
import SlugField from './SlugField';
import { slugError } from '../utils/slug';
import { useTranslation } from '../i18n';

// One form for both create and edit. `permission` is set when editing; its module is then fixed.
export default function PermissionFormModal({ permission, module, onClose }) {
  const dispatch = useDispatch();
  const { t, localName } = useTranslation();
  const [form, setForm] = useState({
    module: module.key,
    name: permission?.name ?? '',
    nameJa: permission?.nameJa ?? '',
    // Only the part after "<module>." is typed; the module slug is added in front.
    slug: permission ? permission.key.slice(permission.key.indexOf('.') + 1) : '',
    description: permission?.description ?? '',
    descriptionJa: permission?.descriptionJa ?? '',
  });
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
    if (!permission && slugError(form.slug)) {
      setSlugProblem(t(slugError(form.slug)));
      return;
    }
    setIsSaving(true);
    try {
      const saved = permission
        ? await dispatch(updatePermission({ key: permission.key, changes: form })).unwrap()
        : await dispatch(createPermission(form)).unwrap();
      dispatch(showToast({ message: t(permission ? 'common.updatedToast' : 'common.createdToast', { name: saved.name }) }));
      onClose();
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  }

  return (
    <Modal title={`${permission ? t('modules.editPermission') : t('modules.addPermission')} · ${localName(module)}`} size="lg" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <BilingualFields
          id="permission"
          form={form}
          nameError={error}
          nameHint={t('modules.permissionHint')}
          onChange={(field, value) => {
            setForm((current) => ({ ...current, [field]: value }));
            if (field === 'name') setError('');
          }}
        />
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
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? t('common.saving') : permission ? t('common.saveChanges') : t('modules.createPermission')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
