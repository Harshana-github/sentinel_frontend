import { useTranslation } from '../i18n';

// Label, control, hint and error for one form field. The control itself should set
// aria-invalid and aria-describedby={`${id}-error`} when there is an error (see errorProps).
// `required` / `optional` show a 必須 / 任意 tag after the label.
export default function FormField({ id, label, error, hint, required = false, optional = false, children }) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-2 font-medium text-slate-900">
        {label}
        {required && <span className="field-tag bg-red-50 text-red-700">{t('common.required')}</span>}
        {optional && <span className="field-tag bg-slate-100 text-slate-500">{t('common.optional')}</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }) {
  return (
    <p id={id} className="text-[13px] text-red-700">
      {children}
    </p>
  );
}

export function errorProps(id, error) {
  return error ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {};
}
