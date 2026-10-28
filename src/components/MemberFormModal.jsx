import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { createMember, fetchRoleOptions, updateMember } from '../features/organizations/organizationsThunks';
import { showToast } from '../features/ui/uiSlice';
import { buildLoginMessage } from '../utils/loginMessage';
import Alert from './Alert';
import CopyButton from './CopyButton';
import FormField, { errorProps } from './FormField';
import Modal from './Modal';
import { useTranslation } from '../i18n';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validate(form, isNew, t) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = t('team.nameRequired');
  if (!form.role) errors.role = t('team.roleRequired');
  if (isNew) {
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = t('auth.emailInvalid');
    if (form.password.length < MIN_PASSWORD_LENGTH) errors.password = t('validation.passwordLength', { min: MIN_PASSWORD_LENGTH });
  }
  return errors;
}

// Shown once after a user is created, so the details can be sent to them by hand.
function LoginDetails({ member, password, organizationName, onDone }) {
  const { t } = useTranslation();
  const message = buildLoginMessage({ name: organizationName }, { ...member, password }, t);
  return (
    <div>
      <p className="mb-4">{t('team.addedMessage', { name: member.name, role: member.roleName })}</p>
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

// Add a person with a role, or change a person's name and role when `member` is set.
export default function MemberFormModal({ member, onClose }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const isNew = !member;
  const isSelf = member?.id === user.id;
  const [form, setForm] = useState({ name: member?.name ?? '', email: member?.email ?? '', password: '', role: member?.role ?? '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleOptions, setRoleOptions] = useState({ items: [], status: 'loading' });
  const [created, setCreated] = useState(null);

  useEffect(() => {
    dispatch(fetchRoleOptions())
      .unwrap()
      .then((items) => setRoleOptions({ items, status: 'succeeded' }))
      .catch((error) => setRoleOptions({ items: [], status: 'failed', error: error.message }));
  }, [dispatch]);

  // Admin first, then the other roles by name.
  const roles = [...roleOptions.items].sort((a, b) => Number(b.system) - Number(a.system) || a.name.localeCompare(b.name));
  const selectedRole = roles.find((role) => role.slug === form.role);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    const validationErrors = validate(form, isNew, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setSubmitError('');
    try {
      if (isNew) {
        const saved = await dispatch(createMember(form)).unwrap();
        dispatch(showToast({ message: t('team.added', { name: saved.name }) }));
        setCreated(saved);
      } else {
        const changes = { name: form.name, ...(isSelf ? {} : { role: form.role }) };
        const saved = await dispatch(updateMember({ id: member.id, changes })).unwrap();
        dispatch(showToast({ message: t('common.updatedToast', { name: saved.name }) }));
        onClose();
      }
    } catch (saveError) {
      setSubmitError(saveError.message);
      setIsSaving(false);
    }
  }

  if (created) {
    return (
      <Modal title={t('team.addedTitle')} onClose={onClose}>
        <LoginDetails member={created} password={form.password} organizationName={user.organizationName} onDone={onClose} />
      </Modal>
    );
  }

  return (
    <Modal title={isNew ? t('team.add') : t('common.editItem', { name: member.name })} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        <FormField id="member-name" label={t('team.fullName')} required error={errors.name}>
          <input
            id="member-name"
            className="input"
            value={form.name}
            autoFocus
            onChange={(event) => setField('name', event.target.value)}
            {...errorProps('member-name', errors.name)}
          />
        </FormField>

        <FormField
          id="member-email"
          label={t('team.email')}
          required={isNew}
          error={errors.email}
          hint={isNew ? t('team.emailHint') : t('team.emailLocked')}
        >
          <input
            id="member-email"
            type="email"
            className="input"
            value={form.email}
            disabled={!isNew}
            onChange={(event) => setField('email', event.target.value)}
            {...errorProps('member-email', errors.email)}
          />
        </FormField>

        {isNew && (
          <FormField
            id="member-password"
            label={t('auth.password')}
            required
            hint={t('team.passwordHint', { min: MIN_PASSWORD_LENGTH })}
            error={errors.password}
          >
            <div className="relative">
              <input
                id="member-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="input pr-11"
                value={form.password}
                onChange={(event) => setField('password', event.target.value)}
                {...errorProps('member-password', errors.password)}
              />
              <button
                type="button"
                className="icon-btn absolute top-0.5 right-0.5"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </FormField>
        )}

        <FormField
          id="member-role"
          label={t('team.role')}
          required
          error={errors.role ?? roleOptions.error}
          hint={
            isSelf
              ? t('team.ownRoleLocked')
              : selectedRole
                ? t('team.roleSummary', { description: selectedRole.description || selectedRole.name, count: selectedRole.permissionCount })
                : t('team.roleHint')
          }
        >
          <select
            id="member-role"
            className="input"
            value={form.role}
            disabled={isSelf || roleOptions.status !== 'succeeded'}
            onChange={(event) => setField('role', event.target.value)}
            {...errorProps('member-role', errors.role)}
          >
            <option value="">{roleOptions.status === 'loading' ? t('common.loading') : t('common.selectPlaceholder')}</option>
            {roles.map((role) => (
              <option key={role.slug} value={role.slug}>
                {role.system ? t('roles.fullAccessName', { name: role.name }) : role.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? t('common.saving') : isNew ? t('team.add') : t('common.saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
