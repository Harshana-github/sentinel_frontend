import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff } from 'lucide-react';
import { createOrganization } from '../features/organizations/organizationsThunks';
import { showToast } from '../features/ui/uiSlice';
import Alert from './Alert';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import SlugField from './SlugField';
import { slugError } from '../utils/slug';
import { buildLoginMessage } from '../utils/loginMessage';
import { useTranslation } from '../i18n';
import CopyButton from './CopyButton';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SECTION_HEADING = 'text-[13px] font-semibold tracking-wide text-slate-500 uppercase';
const EMPTY_FORM = { name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '' };

function validate(form, t) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = t('organizations.nameRequired');
  else if (name.length < 2 || name.length > 80) errors.name = t('organizations.nameLength');
  if (slugError(form.slug)) errors.slug = t(slugError(form.slug));
  if (!form.adminName.trim()) errors.adminName = t('team.nameRequired');
  if (!EMAIL_PATTERN.test(form.adminEmail.trim())) errors.adminEmail = t('auth.emailInvalid');
  if (form.adminPassword.length < MIN_PASSWORD_LENGTH) errors.adminPassword = t('validation.passwordLength', { min: MIN_PASSWORD_LENGTH });
  if (!form.confirmPassword) errors.confirmPassword = t('organizations.confirmRequired');
  else if (form.confirmPassword !== form.adminPassword) errors.confirmPassword = t('organizations.passwordMismatch');
  return errors;
}

// Step 1 collects the organization and its admin, including the admin's password.
// Step 2 shows the login details so the Super Admin can send them manually. No email is sent.
export default function CreateOrganizationModal({ onClose }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
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
    const validationErrors = validate(form, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const { confirmPassword: _confirmOnly, ...organizationData } = form;
      const result = await dispatch(createOrganization(organizationData)).unwrap();
      dispatch(showToast({ message: t('organizations.created', { name: result.organization.name }) }));
      setCreated(result);
    } catch (error) {
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  }

  if (created) {
    return (
      <Modal title={t('organizations.createdTitle')} onClose={onClose}>
        <AdminLoginDetails organization={created.organization} admin={created.admin} password={form.adminPassword} onDone={onClose} />
      </Modal>
    );
  }

  return (
    <Modal title={t('organizations.new')} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        <section className="mb-2">
          <h3 className={`mb-3 ${SECTION_HEADING}`}>{t('common.organization')}</h3>
          <FormField id="organization-name" label={t('common.name')} required error={errors.name}>
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
          <h3 className={`mb-1 ${SECTION_HEADING}`}>{t('organizations.admin')}</h3>
          <p className="mb-3 text-xs text-slate-500">{t('organizations.adminHelp')}</p>
          <FormField id="admin-name" label={t('team.fullName')} required error={errors.adminName}>
            <input
              id="admin-name"
              name="adminName"
              className="input"
              value={form.adminName}
              onChange={updateField}
              {...errorProps('admin-name', errors.adminName)}
            />
          </FormField>
          <FormField id="admin-role" label={t('team.role')} hint={t('organizations.adminRoleHint')}>
            <select id="admin-role" className="input" value="Admin" disabled>
              <option value="Admin">{t('organizations.adminRole')}</option>
            </select>
          </FormField>
          <FormField id="admin-email" label={t('team.email')} required hint={t('team.emailHint')} error={errors.adminEmail}>
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
          <FormField
            id="admin-password"
            label={t('auth.password')}
            required
            error={errors.adminPassword}
            hint={t('validation.passwordLength', { min: MIN_PASSWORD_LENGTH })}
          >
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
                aria-label={showPasswords ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={showPasswords}
                onClick={() => setShowPasswords((visible) => !visible)}
              >
                {showPasswords ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </FormField>
          <FormField id="admin-confirm-password" label={t('organizations.confirmPassword')} required error={errors.confirmPassword}>
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
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('common.creating') : t('organizations.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Shown once after creating, so the Super Admin can send the login details by hand.
function AdminLoginDetails({ organization, admin, password, onDone }) {
  const { t } = useTranslation();
  const message = buildLoginMessage(organization, { ...admin, password }, t);

  return (
    <div>
      <p className="mb-4">{t('organizations.createdMessage', { name: organization.name, admin: admin.name })}</p>
      <pre className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-[13px] whitespace-pre-wrap">{message}</pre>
      <Alert className="mb-4">{t('team.passwordOnce')}</Alert>
      <div className="flex justify-end gap-2">
        <CopyButton value={message} label={t('copy.loginDetails')} text={t('copy.copyMessage')} />
        <button type="button" className="btn btn-primary" onClick={onDone}>
          {t('common.done')}
        </button>
      </div>
    </div>
  );
}
