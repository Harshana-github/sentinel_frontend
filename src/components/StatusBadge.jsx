import { useMasterList } from '../features/masters/useMasterList';

const STATUS_TONES = {
  Active: 'success',
  Completed: 'success',
  Resolved: 'success',
  Running: 'info',
  'In Progress': 'info',
  Open: 'warning',
  'On Hold': 'warning',
  'Completed with errors': 'warning',
  Failed: 'danger',
};

const TONE_CLASSES = {
  success: 'bg-green-100 text-green-700',
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
};

// A badge in one of the STATUS_TONES colours.
export function ToneBadge({ label, tone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONE_CLASSES[tone]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

// The status text is always shown, so meaning never depends on colour alone.
export default function StatusBadge({ status }) {
  return <ToneBadge label={status} tone={STATUS_TONES[status] ?? 'neutral'} />;
}

// For statuses managed on the Statuses page: `category` is a STATUS_CATEGORIES key and
// `value` the stored status id. Name and colour come from that list.
export function CategoryStatusBadge({ category, value }) {
  const statuses = useMasterList(category);
  const status = statuses.find(value);
  return <ToneBadge label={status?.name ?? value} tone={TONE_CLASSES[status?.tone] ? status.tone : 'neutral'} />;
}
