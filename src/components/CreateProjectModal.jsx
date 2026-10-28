import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { createProject } from '../features/projects/projectsThunks';
import { showToast } from '../features/ui/uiSlice';
import { PROJECT_ENVIRONMENTS } from '../utils/constants';
import { PROJECT_CODE_MAX, projectCodeError, suggestProjectCode } from '../utils/projectCode';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import Alert from './Alert';
import { useTranslation } from '../i18n';

const EMPTY_FORM = { name: '', code: '', environment: 'Production', description: '' };

function validate(form, t) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = t('projects.nameRequired');
  else if (name.length < 3 || name.length > 60) errors.name = t('projects.nameLength');
  const codeProblem = projectCodeError(form.code);
  if (codeProblem) errors.code = t(codeProblem);
  if (form.description.length > 300) errors.description = t('validation.descriptionLength');
  return errors;
}

export default function CreateProjectModal({ onClose, onCreated }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The code follows the name until the user types their own.
  const [codeTouched, setCodeTouched] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'name' && !codeTouched ? { code: suggestProjectCode(value) } : {}),
    }));
    setErrors((current) => ({ ...current, [name]: undefined, ...(name === 'name' && !codeTouched ? { code: undefined } : {}) }));
  }

  function updateCode(event) {
    setCodeTouched(true);
    const code = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, PROJECT_CODE_MAX);
    setForm((current) => ({ ...current, code }));
    setErrors((current) => ({ ...current, code: undefined }));
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
      const project = await dispatch(createProject(form)).unwrap();
      dispatch(showToast({ message: t('projects.created', { name: project.name }) }));
      onCreated(project);
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={t('projects.createTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <p className="mb-4 text-slate-500">{t('projects.createHelp', { organization: user?.organizationName })}</p>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}
        <div className="grid gap-x-3 sm:grid-cols-[1fr_170px]">
          <FormField id="project-name" label={t('projects.name')} required error={errors.name}>
            <input
              id="project-name"
              name="name"
              className="input"
              value={form.name}
              onChange={updateField}
              autoFocus
              {...errorProps('project-name', errors.name)}
            />
          </FormField>
          <FormField id="project-code" label={t('projects.code')} required hint={t('projects.codeHint')} error={errors.code}>
            <input
              id="project-code"
              name="code"
              className="input font-mono tracking-wide uppercase"
              placeholder="WEB"
              value={form.code}
              onChange={updateCode}
              {...errorProps('project-code', errors.code)}
            />
          </FormField>
        </div>
        <FormField id="project-environment" label={t('projects.environment')} required>
          <select id="project-environment" name="environment" className="input" value={form.environment} onChange={updateField}>
            {PROJECT_ENVIRONMENTS.map((environment) => (
              <option key={environment} value={environment}>
                {t(`environments.${environment}`)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="project-description" label={t('common.description')} optional error={errors.description}>
          <textarea
            id="project-description"
            name="description"
            className="input h-auto py-2"
            rows={3}
            value={form.description}
            onChange={updateField}
            {...errorProps('project-description', errors.description)}
          />
        </FormField>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('common.creating') : t('projects.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
