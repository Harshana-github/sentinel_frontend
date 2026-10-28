import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Globe, Mail, Phone } from 'lucide-react';
import ProductLogo from '../components/ProductLogo';
import { selectBranding } from '../features/branding/brandingSlice';
import { clearAuthError } from '../features/auth/authSlice';
import { login } from '../features/auth/authThunks';
import { showToast } from '../features/ui/uiSlice';
import FormField, { errorProps } from '../components/FormField';
import { demoAccounts } from '../mocks/mockData';
import { USE_MOCK_DATA } from '../services/api';
import Alert from '../components/Alert';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ identifier, password }) {
  const errors = {};
  const trimmed = identifier.trim();
  if (!trimmed) errors.identifier = 'Enter your email or username.';
  else if (trimmed.includes('@') && !EMAIL_PATTERN.test(trimmed)) errors.identifier = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const branding = useSelector(selectBranding);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const isSubmitting = status === 'loading';

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    if (error) dispatch(clearAuthError());
  }

  function fillDemoAccount(account) {
    setForm({ identifier: account.email, password: account.password });
    setFieldErrors({});
    if (error) dispatch(clearAuthError());
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const session = await dispatch(login(form)).unwrap();
      dispatch(showToast({ message: `Welcome back, ${session.user.name}.` }));
    } catch {
      // The error message comes from the auth slice and is shown above the form.
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-center gap-3.5 bg-slate-900 p-12 text-slate-300 lg:flex" aria-label="About this product">
        <ProductLogo src={branding.productLogo} size={44} className="text-blue-400" />
        <h2 className="text-3xl font-bold text-white">{branding.productName}</h2>
        {branding.tagline && <p className="max-w-sm text-base">{branding.tagline}</p>}

        {branding.company.name && (
          <div className="mt-10 max-w-sm border-t border-slate-700 pt-5 text-[13px] text-slate-400">
            <p className="mb-2 flex items-center gap-2">
              {branding.company.logo && <img src={branding.company.logo} alt="" className="size-6 object-contain" />}
              Developed by <span className="font-semibold text-slate-200">{branding.company.name}</span>
            </p>
            <ul className="flex flex-col gap-1">
              {[
                [Mail, branding.company.email],
                [Phone, branding.company.phone],
                [Globe, branding.company.website],
              ]
                .filter(([, value]) => value)
                .map(([Icon, value]) => (
                  <li key={value} className="flex items-center gap-1.5">
                    <Icon size={13} aria-hidden="true" />
                    {value}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>

      <main className="grid place-items-center px-4 py-8">
        <div className="w-full max-w-100">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-1 mb-6 text-slate-500">Use your {branding.productName} account to continue.</p>

          {error && (
            <Alert tone="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField id="login-identifier" label="Email or username" error={fieldErrors.identifier}>
              <input
                id="login-identifier"
                name="identifier"
                className="input"
                autoComplete="username"
                value={form.identifier}
                onChange={updateField}
                {...errorProps('login-identifier', fieldErrors.identifier)}
              />
            </FormField>

            <FormField id="login-password" label="Password" error={fieldErrors.password}>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  className="input pr-11"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={updateField}
                  {...errorProps('login-password', fieldErrors.password)}
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

            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {USE_MOCK_DATA && (
            <aside className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-3.5" aria-label="Demo accounts">
              <p className="mb-2.5">
                <strong>Demo accounts</strong> (mock mode only)
              </p>
              <ul className="flex flex-col gap-2.5">
                {demoAccounts.map((account) => (
                  <li key={account.email} className="flex items-center justify-between gap-2.5">
                    <div className="flex flex-col">
                      <strong>{account.label}</strong>
                      <span className="text-xs text-slate-500">{account.description}</span>
                      <span className="text-xs">
                        <code>{account.email}</code> / <code>{account.password}</code>
                      </span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillDemoAccount(account)}>
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
