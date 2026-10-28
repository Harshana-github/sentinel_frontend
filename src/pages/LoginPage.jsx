import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CircleCheck, Eye, EyeOff, Globe, Mail, Phone } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ScanField from '../components/ScanField';
import ProductLogo from '../components/ProductLogo';
import { selectBranding } from '../features/branding/brandingSlice';
import { clearAuthError } from '../features/auth/authSlice';
import { login } from '../features/auth/authThunks';
import { showToast } from '../features/ui/uiSlice';
import FormField, { errorProps } from '../components/FormField';
import { demoAccounts } from '../mocks/mockData';
import { USE_MOCK_DATA } from '../services/api';
import Alert from '../components/Alert';
import { useTranslation } from '../i18n';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ identifier, password }, t) {
  const errors = {};
  const trimmed = identifier.trim();
  if (!trimmed) errors.identifier = t('auth.identifierRequired');
  else if (trimmed.includes('@') && !EMAIL_PATTERN.test(trimmed)) errors.identifier = t('auth.emailInvalid');
  if (!password) errors.password = t('auth.passwordRequired');
  return errors;
}

const HIGHLIGHTS = ['auth.highlight1', 'auth.highlight2', 'auth.highlight3'];

export default function LoginPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
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
    const errors = validate(form, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const session = await dispatch(login(form)).unwrap();
      dispatch(showToast({ message: t('auth.welcome', { name: session.user.name }) }));
    } catch {
      // The error message comes from the auth slice and is shown above the form.
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section
        className="relative hidden flex-col justify-center gap-3.5 overflow-hidden bg-linear-to-br from-ink-950 via-ink-900 to-blue-950 p-14 text-ink-300 lg:flex"
        aria-label={t('auth.aboutProduct')}
      >
        {/* Background: the network the mouse scans, darkened behind the text so it stays readable. */}
        <ScanField />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink-950/85 via-ink-950/40 to-transparent" aria-hidden="true" />

        <div className="relative z-10 flex flex-col gap-3.5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1 text-xs font-medium text-ink-200">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            {t('auth.liveChip')}
          </span>
          <ProductLogo src={branding.productLogo} size={44} className="text-blue-400" />
          <h2 className="text-3xl font-bold text-white">{branding.productName}</h2>
          {branding.tagline && <p className="max-w-sm text-base">{branding.tagline}</p>}
          <ul className="mt-6 flex max-w-sm flex-col gap-3">
            {HIGHLIGHTS.map((key) => (
              <li key={key} className="flex items-start gap-2.5">
                <CircleCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-400" />
                {t(key)}
              </li>
            ))}
          </ul>

          {branding.company.name && (
            <div className="mt-10 max-w-sm border-t border-ink-700 pt-5 text-[13px] text-ink-400">
              <p className="mb-2 flex items-center gap-2">
                {branding.company.logo && <img src={branding.company.logo} alt="" className="size-6 object-contain" />}
                {t('footer.developedBy')} <span className="font-semibold text-ink-200">{branding.company.name}</span>
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
        </div>
      </section>

      <main className="relative grid place-items-center bg-surface px-4 py-16">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className="w-full max-w-100">
          <h1 className="text-2xl font-bold">{t('auth.signIn')}</h1>
          <p className="mt-1 mb-6 text-slate-500">{t('auth.signInHelp', { product: branding.productName })}</p>

          {error && (
            <Alert tone="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField id="login-identifier" label={t('auth.identifier')} error={fieldErrors.identifier}>
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

            <FormField id="login-password" label={t('auth.password')} error={fieldErrors.password}>
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
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </FormField>

            <button type="submit" className="btn btn-primary h-10 w-full" disabled={isSubmitting}>
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          {USE_MOCK_DATA && (
            <aside className="mt-6 rounded-lg border border-dashed border-slate-300 bg-surface p-3.5" aria-label={t('auth.demoAccounts')}>
              <p className="mb-2.5">
                <strong>{t('auth.demoAccounts')}</strong> <span className="text-slate-500">{t('auth.demoOnly')}</span>
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
                      {t('auth.useAccount')}
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
