import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateProject } from '../features/projects/projectsThunks';
import { useStatusList } from '../features/masters/useStatusList';
import { showToast } from '../features/ui/uiSlice';
import { PROJECT_ENVIRONMENTS, PROJECT_STATUSES } from '../utils/constants';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import Alert from './Alert';
import { useTranslation } from '../i18n';

function validate(form, t) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = t('projects.nameRequired');
  else if (name.length < 3 || name.length > 60) errors.name = t('projects.nameLength');
  if (form.description.length > 300) errors.description = t('validation.descriptionLength');
  return errors;
}

export default function EditProjectModal({ project, onClose }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const projectStatuses = useStatusList('project-statuses');
  const [form, setForm] = useState({
    name: project.name,
    environment: project.environment,
    status: project.status,
    description: project.description,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationErrors = validate(form, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const updated = await dispatch(updateProject({ projectId: project.id, changes: form })).unwrap();
      dispatch(showToast({ message: t('projects.updated', { name: updated.name }) }));
      onClose();
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={t('projects.editTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}
        <FormField id="edit-project-name" label={t('projects.name')} required error={errors.name}>
          <input
            id="edit-project-name"
            name="name"
            className="input"
            value={form.name}
            onChange={updateField}
            autoFocus
            {...errorProps('edit-project-name', errors.name)}
          />
        </FormField>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <FormField id="edit-project-environment" label={t('projects.environment')} required>
            <select id="edit-project-environment" name="environment" className="input" value={form.environment} onChange={updateField}>
              {PROJECT_ENVIRONMENTS.map((environment) => (
                <option key={environment} value={environment}>
                  {t(`environments.${environment}`)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="edit-project-status" label={t('common.status')} required>
            <select id="edit-project-status" name="status" className="input" value={form.status} onChange={updateField}>
              {projectStatuses.options(PROJECT_STATUSES).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField id="edit-project-description" label={t('common.description')} optional error={errors.description}>
          <textarea
            id="edit-project-description"
            name="description"
            className="input h-auto py-2"
            rows={3}
            value={form.description}
            onChange={updateField}
            {...errorProps('edit-project-description', errors.description)}
          />
        </FormField>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('common.saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
