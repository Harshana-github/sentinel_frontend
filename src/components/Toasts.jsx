import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CircleCheck, CircleX, X } from 'lucide-react';
import { dismissToast, selectToasts } from '../features/ui/uiSlice';
import { useTranslation } from '../i18n';

const TOAST_DURATION_MS = 4500;

export default function Toasts() {
  const toasts = useSelector(selectToasts);
  return (
    <div className="fixed right-5 bottom-5 z-60 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  const isError = toast.type === 'error';
  const Icon = isError ? CircleX : CircleCheck;

  return (
    <div
      role={isError ? 'alert' : undefined}
      className={`flex items-start gap-2.5 rounded-lg border border-l-4 border-slate-200 bg-white py-3 pr-2.5 pl-3.5 shadow-lg ${isError ? 'border-l-red-600' : 'border-l-green-600'}`}
    >
      <Icon size={18} aria-hidden="true" className={`mt-px shrink-0 ${isError ? 'text-red-600' : 'text-green-600'}`} />
      <p className="flex-1">{toast.message}</p>
      <button type="button" className="icon-btn size-6.5" aria-label={t('common.close')} onClick={() => dispatch(dismissToast(toast.id))}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
