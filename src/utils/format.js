import { getLanguage, translate } from '../i18n';

// Dates and times follow the UI language: Japanese uses 2026/10/28 14:05, English Oct 28, 2026, 2:05 PM.
const LOCALES = { ja: 'ja-JP', en: 'en-US' };
const locale = () => LOCALES[getLanguage()];
const t = (key, values) => translate(getLanguage(), key, values);

export function formatDateTime(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleString(locale(), {
    year: 'numeric',
    month: getLanguage() === 'ja' ? '2-digit' : 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString(locale(), { year: 'numeric', month: getLanguage() === 'ja' ? '2-digit' : 'short', day: '2-digit' });
}

export function formatRelativeTime(isoDate) {
  if (!isoDate) return '—';
  const seconds = Math.round((Date.parse(isoDate) - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 45) return t('time.justNow');
  const formatter = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  if (absolute < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
  if (absolute < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
  return formatter.format(Math.round(seconds / 86400), 'day');
}

export function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return '—';
  const totalSeconds = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return t('time.hoursMinutes', { hours, minutes });
  if (minutes > 0) return t('time.minutesSeconds', { minutes, seconds });
  return t('time.seconds', { seconds });
}

export function includesText(value, search) {
  return String(value ?? '')
    .toLowerCase()
    .includes(search.trim().toLowerCase());
}
