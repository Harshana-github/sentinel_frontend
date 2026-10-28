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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validate(form, isNew) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter the full name.';
  if (!form.role) errors.role = 'Choose a role.';
  if (isNew) {
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (form.password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return errors;
}

// Shown once after a user is created, so the details can be sent to them by hand.
function LoginDetails({ member, password, organizationName, onDone }) {
  const message = buildLoginMessage({ name: organizationName }, { ...member, password });
  return (
    <div>
      <p className="mb-4">
        <strong>{member.name}</strong> was added as <strong>{member.roleName}</strong>. Send them these login details.
      </p>
      <pre className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-[13px] whitespace-pre-wrap">{message}</pre>
      <Alert className="mb-4">The password is not shown again. Copy the message before you close this window.</Alert>
      <div className="flex justify-end gap-2">
        <CopyButton value={message} label="Copy the login details" text="Copy message" />
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

// Add a person with a role, or change a person's name and role when `member` is set.
export default function MemberFormModal({ member, onClose }) {
  const dispatch = useDispatch();
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
    const validationErrors = validate(form, isNew);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setSubmitError('');
    try {
      if (isNew) {
        const saved = await dispatch(createMember(form)).unwrap();
        dispatch(showToast({ message: `${saved.name} was added.` }));
        setCreated(saved);
      } else {
        const changes = { name: form.name, ...(isSelf ? {} : { role: form.role }) };
        const saved = await dispatch(updateMember({ id: member.id, changes })).unwrap();
        dispatch(showToast({ message: `${saved.name} updated.` }));
        onClose();
      }
    } catch (saveError) {
      setSubmitError(saveError.message);
      setIsSaving(false);
    }
  }

  if (created) {
    return (
      <Modal title="User added" onClose={onClose}>
        <LoginDetails member={created} password={form.password} organizationName={user.organizationName} onDone={onClose} />
      </Modal>
    );
  }

  return (
    <Modal title={isNew ? 'Add user' : `Edit ${member.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        <FormField id="member-name" label="Full name" error={errors.name}>
          <input id="member-name" className="input" value={form.name} autoFocus onChange={(event) => setField('name', event.target.value)} {...errorProps('member-name', errors.name)} />
        </FormField>

        <FormField id="member-email" label="Email (used to sign in)" error={errors.email} hint={isNew ? undefined : 'The email cannot be changed.'}>
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
          <FormField id="member-password" label="Password" hint={`At least ${MIN_PASSWORD_LENGTH} characters. You send it to them yourself.`} error={errors.password}>
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          label="Role"
          error={errors.role ?? roleOptions.error}
          hint={isSelf ? 'You cannot change your own role.' : selectedRole ? `${selectedRole.description || selectedRole.name} · ${selectedRole.permissionCount} permissions` : 'Decides what this person can do.'}
        >
          <select
            id="member-role"
            className="input"
            value={form.role}
            disabled={isSelf || roleOptions.status !== 'succeeded'}
            onChange={(event) => setField('role', event.target.value)}
            {...errorProps('member-role', errors.role)}
          >
            <option value="">{roleOptions.status === 'loading' ? 'Loading roles…' : 'Choose a role'}</option>
            {roles.map((role) => (
              <option key={role.slug} value={role.slug}>
                {role.system ? `${role.name} (full access)` : role.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : isNew ? 'Add user' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
