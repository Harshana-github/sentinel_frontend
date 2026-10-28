import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../i18n';

const WIDTHS = { sm: 'w-[min(440px,calc(100vw-2rem))]', md: 'w-[min(560px,calc(100vw-2rem))]', lg: 'w-[min(760px,calc(100vw-2rem))]' };

// Uses the native <dialog> element, which traps focus and closes on Escape.
// Render it conditionally: {isOpen && <Modal … />}.
export default function Modal({ title, onClose, size = 'md', children }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previouslyFocused?.focus?.();
    };
  }, []);

  function handleCancel(event) {
    // Let React own the open state instead of the browser closing the dialog itself.
    event.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      className={`m-auto max-h-[calc(100vh-3rem)] rounded-xl p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50 ${WIDTHS[size]}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 id={titleId} className="text-base font-bold">
          {title}
        </h2>
        <button type="button" className="icon-btn" aria-label={t('common.close')} onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
