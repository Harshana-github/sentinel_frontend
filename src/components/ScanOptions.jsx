import { useState } from 'react';
import { SCAN_PROFILES } from '../utils/constants';
import { errorProps, FieldError } from './FormField';

// Form pieces shared by the scan forms (the Single scan dialog and the Quick scan page).

// A radio button or checkbox shown as a selectable card.
export function OptionCard({ type = 'radio', name, checked, onChange, title, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-slate-200 p-3 has-checked:border-blue-600 has-checked:bg-blue-50">
      <input className="mt-1" type={type} name={name} checked={checked} onChange={onChange} />
      <span className="flex flex-col gap-0.5">
        <strong className="flex items-center gap-1.5">{title}</strong>
        {description && <span className="text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

const cardGrid = 'grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2';

export function ScanProfilePicker({ value, onChange }) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 font-medium">Scan profile</legend>
      <div className={cardGrid}>
        {SCAN_PROFILES.map((option) => (
          <OptionCard
            key={option.value}
            name="scan-profile"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            title={option.value}
            description={option.description}
          />
        ))}
      </div>
    </fieldset>
  );
}

// The tools to run. Every tool that fits the target is selected until the user changes it;
// `reset()` goes back to that default, e.g. when the target changes.
export function useToolSelection(tools) {
  const [picked, setPicked] = useState(null);
  const selected = picked ?? tools.map((tool) => tool.id);
  return {
    selected,
    toggle: (id) => setPicked(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]),
    reset: () => setPicked(null),
  };
}

export function ToolPicker({ legend = 'Tools', tools, selection, error, emptyMessage = 'No enabled tool can scan this target type yet.', onChange }) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 font-medium">{legend}</legend>
      {tools.length === 0 ? (
        <p className="text-[13px] text-slate-500">{emptyMessage}</p>
      ) : (
        <div className={cardGrid}>
          {tools.map((tool) => (
            <OptionCard
              key={tool.id}
              type="checkbox"
              checked={selection.selected.includes(tool.id)}
              onChange={() => {
                selection.toggle(tool.id);
                onChange?.();
              }}
              title={tool.name}
              description={tool.categoryName}
            />
          ))}
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
    </fieldset>
  );
}

// The consent gate every scan needs. The API checks it again.
export function AuthorizationCheckbox({ id, checked, onChange, error, plural = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex cursor-pointer items-start gap-2 font-medium">
        <input className="mt-1" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} {...errorProps(id, error)} />I
        confirm that I am authorized to scan {plural ? 'these targets' : 'this target'}.
      </label>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}
