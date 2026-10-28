import { CircleX, Inbox, LoaderCircle } from 'lucide-react';

const STATE_CLASSES = 'flex flex-col items-center gap-2 px-4 py-10 text-center text-slate-500';

export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className={STATE_CLASSES} role="status">
      <LoaderCircle className="animate-spin motion-reduce:animate-none" size={22} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className={STATE_CLASSES} role="alert">
      <CircleX className="text-red-600" size={22} aria-hidden="true" />
      <p>{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className={STATE_CLASSES}>
      <Inbox size={22} aria-hidden="true" />
      <p className="font-semibold text-slate-900">{title}</p>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
