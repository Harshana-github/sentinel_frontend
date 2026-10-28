// Label, control, hint and error for one form field. The control itself should set
// aria-invalid and aria-describedby={`${id}-error`} when there is an error.
export default function FormField({ id, label, error, hint, children }) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
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
