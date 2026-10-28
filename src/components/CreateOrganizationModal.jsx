import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { createOrganization } from '../features/organizations/organizationsThunks';
import { showToast } from '../features/ui/uiSlice';
import Alert from './Alert';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import SlugField from './SlugField';
import { slugError } from '../utils/slug';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SECTION_HEADING = 'text-[13px] font-semibold tracking-wide text-slate-500 uppercase';
const EMPTY_FORM = { name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '' };

function validate(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Enter the organization name.';
  else if (name.length < 2 || name.length > 80) errors.name = 'Use between 2 and 80 characters.';
  if (slugError(form.slug)) errors.slug = slugError(form.slug);
  if (!form.adminName.trim()) errors.adminName = "Enter the admin's full name.";
  if (!EMAIL_PATTERN.test(form.adminEmail.trim())) errors.adminEmail = "Enter the admin's email address.";
  if (form.adminPassword.length < MIN_PASSWORD_LENGTH) errors.adminPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!form.confirmPassword) errors.confirmPassword = 'Enter the password again.';
  else if (form.confirmPassword !== form.adminPassword) errors.confirmPassword = 'The passwords do not match.';
  return errors;
}

// Step 1 collects the organization and its admin, including the admin's password.
// Step 2 shows the login details so the Super Admin can send them manually. No email is sent.
export default function CreateOrganizationModal({ onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  // { organization, admin } once created.
  const [created, setCreated] = useState(null);

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
      const { confirmPassword: _confirmOnly, ...organizationData } = form;
      const result = await dispatch(createOrganization(organizationData)).unwrap();
      dispatch(showToast({ message: `Organization "${result.organization.name}" and its admin were created.` }));
      setCreated(result);
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  if (created) {
    return (
      <Modal title="Organization created" onClose={onClose}>
        <AdminLoginDetails organization={created.organization} admin={created.admin} password={form.adminPassword} onDone={onClose} />
      </Modal>
    );
  }

  return (
    <Modal title="New organization" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        <section className="mb-2">
          <h3 className={`mb-3 ${SECTION_HEADING}`}>Organization</h3>
          <FormField id="organization-name" label="Name" error={errors.name}>
            <input
              id="organization-name"
              name="name"
              className="input"
              value={form.name}
              onChange={updateField}
              autoFocus
              {...errorProps('organization-name', errors.name)}
            />
          </FormField>
          <SlugField
            id="organization-slug"
            source={form.name}
            value={form.slug}
            error={errors.slug}
            onChange={(slug) => {
              setForm((current) => ({ ...current, slug }));
              setErrors((current) => ({ ...current, slug: undefined }));
            }}
          />
        </section>

        <section className="border-t border-slate-200 pt-4">
          <h3 className={`mb-1 ${SECTION_HEADING}`}>Organization admin</h3>
          <p className="mb-3 text-xs text-slate-500">
            This person signs in first and manages the organization. You send them the login details yourself.
          </p>
          <FormField id="admin-name" label="Full name" error={errors.adminName}>
            <input
              id="admin-name"
              name="adminName"
              className="input"
              value={form.adminName}
              onChange={updateField}
              {...errorProps('admin-name', errors.adminName)}
            />
          </FormField>
          <FormField id="admin-role" label="Role" hint="Full access to all modules and permissions.">
            <select id="admin-role" className="input" value="Admin" disabled>
              <option value="Admin">Admin</option>
            </select>
          </FormField>
          <FormField id="admin-email" label="Email (used to sign in)" error={errors.adminEmail}>
            <input
              id="admin-email"
              name="adminEmail"
              type="email"
              className="input"
              value={form.adminEmail}
              onChange={updateField}
              {...errorProps('admin-email', errors.adminEmail)}
            />
          </FormField>
          <FormField id="admin-password" label="Password" error={errors.adminPassword} hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
            <div className="relative">
              <input
                id="admin-password"
                name="adminPassword"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                className="input pr-11"
                value={form.adminPassword}
                onChange={updateField}
                {...errorProps('admin-password', errors.adminPassword)}
              />
              <button
                type="button"
                className="icon-btn absolute top-0.5 right-0.5"
                aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                aria-pressed={showPasswords}
                onClick={() => setShowPasswords((visible) => !visible)}
              >
                {showPasswords ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </FormField>
          <FormField id="admin-confirm-password" label="Confirm password" error={errors.confirmPassword}>
            <input
              id="admin-confirm-password"
              name="confirmPassword"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="new-password"
              className="input"
              value={form.confirmPassword}
              onChange={updateField}
              {...errorProps('admin-confirm-password', errors.confirmPassword)}
            />
          </FormField>
        </section>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create organization'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AdminLoginDetails({ organization, admin, password, onDone }) {
  const dispatch = useDispatch();
  const loginUrl = `${window.location.origin}/login`;
  const message = `Your Sentinel account for ${organization.name} is ready.\n\nSign in: ${loginUrl}\nEmail: ${admin.email}\nPassword: ${password}`;

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(message);
      dispatch(showToast({ message: 'Login details copied. Paste them into a message to the admin.' }));
    } catch {
      dispatch(showToast({ type: 'error', message: 'Could not copy automatically. Select the details and copy them by hand.' }));
    }
  }

  return (
    <div>
      <p className="mb-4">
        <strong>{organization.name}</strong> was created with <strong>{admin.name}</strong> as its admin. Send these login details to them yourself.
      </p>

      <dl className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div>
          <dt className="text-xs text-slate-500">Sign-in page</dt>
          <dd className="font-mono break-words">{loginUrl}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Email</dt>
          <dd className="font-mono break-words">{admin.email}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Password</dt>
          <dd className="font-mono text-base font-semibold break-words">{password}</dd>
        </div>
      </dl>

      <Alert className="mb-4">Sentinel does not show this password again. Copy the details before you close this window.</Alert>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={copyDetails}>
          <Copy size={16} aria-hidden="true" />
          Copy login details
        </button>
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}
