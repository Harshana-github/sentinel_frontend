import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { slugify, SLUG_MAX_LENGTH } from '../utils/slug';
import FormField, { errorProps } from './FormField';

// Unique slug input. While creating, it follows `source` (usually the name) until the user
// types in it. When editing (`locked`), it is read-only because other records use it.
// `prefix` is shown before the input, e.g. "projects." for a permission key.
export default function SlugField({ id, source, value, onChange, locked = false, prefix, error }) {
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!locked && !touched) onChange(slugify(source));
    // Only `source` matters here; onChange is a new function on every render of the parent.
  }, [source, locked, touched]);

  function handleChange(event) {
    setTouched(true);
    onChange(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, SLUG_MAX_LENGTH));
  }

  const hint = locked ? 'The slug cannot be changed, because other records use it.' : 'Unique id used in URLs and the API. Lowercase letters, numbers and hyphens.';

  return (
    <FormField id={id} label="Slug" hint={hint} error={error}>
      <div className="flex items-stretch">
        {prefix && (
          <span className="flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-2.5 font-mono text-[13px] text-slate-500">{prefix}</span>
        )}
        <div className="relative flex-1">
          <input
            id={id}
            className={`input font-mono text-[13px] ${prefix ? 'rounded-l-none' : ''} ${locked ? 'pr-9' : ''}`}
            value={value}
            readOnly={locked}
            disabled={locked}
            onChange={handleChange}
            {...errorProps(id, error)}
          />
          {locked && <Lock size={14} aria-hidden="true" className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />}
        </div>
      </div>
    </FormField>
  );
}
