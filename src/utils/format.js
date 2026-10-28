const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatDateTime(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function formatRelativeTime(isoDate) {
  if (!isoDate) return '—';
  const seconds = Math.round((Date.parse(isoDate) - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 45) return 'just now';
  if (absolute < 3600) return relativeFormatter.format(Math.round(seconds / 60), 'minute');
  if (absolute < 86400) return relativeFormatter.format(Math.round(seconds / 3600), 'hour');
  return relativeFormatter.format(Math.round(seconds / 86400), 'day');
}

export function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return '—';
  const totalSeconds = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function includesText(value, search) {
  return String(value ?? '')
    .toLowerCase()
    .includes(search.trim().toLowerCase());
}
