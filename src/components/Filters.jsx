import { Search } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder, label }) {
  return (
    <div className="relative max-w-sm flex-[1_1_100%] sm:flex-[1_1_260px]">
      <Search size={16} aria-hidden="true" className="absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        className="input pl-8"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

// `options` can be strings or { value, label } objects.
export function SelectFilter({ label, value, onChange, options, allLabel }) {
  return (
    <select className="input flex-1 sm:w-auto sm:min-w-40 sm:flex-none" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((option) => {
        const { value: optionValue, label: optionLabel } = typeof option === 'string' ? { value: option, label: option } : option;
        return (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        );
      })}
    </select>
  );
}

export function FilterBar({ children, resultCount }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 px-5 py-3.5">
      {children}
      {resultCount !== undefined && (
        <p className="text-[13px] text-slate-500 sm:ml-auto" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </p>
      )}
    </div>
  );
}
