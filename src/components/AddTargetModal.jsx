import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addScanTarget } from '../features/projects/projectsThunks';
import { showToast } from '../features/ui/uiSlice';
import { useMasterList } from '../features/masters/useMasterList';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import Alert from './Alert';

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validate(form, targetType) {
  const errors = {};
  const value = form.value.trim();
  if (!form.type) errors.type = 'Choose a target type.';
  if (!form.name.trim()) errors.name = 'Enter a name for the target.';
  if (!value) {
    errors.value = 'Enter the target address.';
  } else if (/\s/.test(value)) {
    errors.value = 'The target cannot contain spaces.';
  } else if (targetType?.format === 'url' && !isHttpUrl(value)) {
    errors.value = 'Enter a full URL starting with https://';
  }
  return errors;
}

export default function AddTargetModal({ project, onClose }) {
  const dispatch = useDispatch();
  const targetTypes = useMasterList('target-types');
  const [form, setForm] = useState({ type: '', name: '', value: '' });
  const targetType = targetTypes.find(form.type);

  // Preselect the first target type once the list has loaded.
  useEffect(() => {
    if (!form.type && targetTypes.items.length > 0) setForm((current) => ({ ...current, type: targetTypes.items[0].id }));
  }, [form.type, targetTypes.items]);
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
    const validationErrors = validate(form, targetType);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await dispatch(addScanTarget({ projectId: project.id, target: form })).unwrap();
      dispatch(showToast({ message: `Target "${form.name.trim()}" was added to ${project.name}.` }));
      onClose();
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Add scan target to ${project.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}
        <FormField id="target-type" label="Target type" error={errors.type}>
          <select id="target-type" name="type" className="input" value={form.type} onChange={updateField}>
            {targetTypes.items.length === 0 && <option value="">Loading target types…</option>}
            {targetTypes.items.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="target-name" label="Name" error={errors.name} hint="A short label, for example “Production website”.">
          <input id="target-name" name="name" className="input" value={form.name} onChange={updateField} autoFocus {...errorProps('target-name', errors.name)} />
        </FormField>
        <FormField id="target-value" label="Address" error={errors.value} hint={targetType?.placeholder ? `Example: ${targetType.placeholder}` : undefined}>
          <input
            id="target-value"
            name="value"
            className="input font-mono"
            value={form.value}
            placeholder={targetType?.placeholder}
            onChange={updateField}
            {...errorProps('target-value', errors.value)}
          />
        </FormField>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add target'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
