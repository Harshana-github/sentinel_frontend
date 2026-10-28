import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { createProject } from '../features/projects/projectsThunks';
import { showToast } from '../features/ui/uiSlice';
import { PROJECT_ENVIRONMENTS } from '../utils/constants';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import Alert from './Alert';

const EMPTY_FORM = { name: '', environment: 'Production', description: '' };

function validate(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Enter a project name.';
  else if (name.length < 3 || name.length > 60) errors.name = 'Use between 3 and 60 characters.';
  if (form.description.length > 300) errors.description = 'Keep the description under 300 characters.';
  return errors;
}

export default function CreateProjectModal({ onClose, onCreated }) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [form, setForm] = useState(EMPTY_FORM);
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
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const project = await dispatch(createProject(form)).unwrap();
      dispatch(showToast({ message: `Project "${project.name}" was created.` }));
      onCreated(project);
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Create project" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <p className="text-slate-500 mb-4">The project is created in {user?.organizationName}.</p>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}
        <FormField id="project-name" label="Project name" error={errors.name}>
          <input id="project-name" name="name" className="input" value={form.name} onChange={updateField} autoFocus {...errorProps('project-name', errors.name)} />
        </FormField>
        <FormField id="project-environment" label="Environment">
          <select id="project-environment" name="environment" className="input" value={form.environment} onChange={updateField}>
            {PROJECT_ENVIRONMENTS.map((environment) => (
              <option key={environment}>{environment}</option>
            ))}
          </select>
        </FormField>
        <FormField id="project-description" label="Description (optional)" error={errors.description}>
          <textarea id="project-description" name="description" className="input h-auto py-2" rows={3} value={form.description} onChange={updateField} {...errorProps('project-description', errors.description)} />
        </FormField>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
