import { CircleX, Inbox, LoaderCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

const STATE_CLASSES = 'flex flex-col items-center gap-2 px-4 py-12 text-center text-slate-500';

export function LoadingState({ message }) {
  const { t } = useTranslation();
  return (
    <div className={STATE_CLASSES} role="status">
      <LoaderCircle className="animate-spin text-blue-600 motion-reduce:animate-none" size={22} aria-hidden="true" />
      <p>{message ?? t('common.loading')}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className={STATE_CLASSES} role="alert">
      <CircleX className="text-red-600" size={22} aria-hidden="true" />
      <p>{message || t('common.somethingWentWrong')}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary mt-1" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className={STATE_CLASSES}>
      <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true">
        <Inbox size={22} />
      </span>
      <p className="font-semibold text-slate-900">{title}</p>
      {message && <p className="max-w-md">{message}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
