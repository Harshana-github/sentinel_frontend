// Tailwind colour classes for charts, kept in one place.
// Class names are written out in full so Tailwind can find them when it scans the code.

export const SEVERITY_BAR_CLASSES = {
  Critical: 'bg-red-800 dark:bg-red-600',
  High: 'bg-orange-600',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
  Informational: 'bg-slate-400',
};

export const SCAN_STATUS_BAR_CLASSES = {
  Queued: 'bg-slate-500',
  Running: 'bg-blue-500',
  Completed: 'bg-green-500',
  Failed: 'bg-red-500',
  Cancelled: 'bg-slate-300',
};
