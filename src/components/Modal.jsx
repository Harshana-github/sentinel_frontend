import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

// Uses the native <dialog> element, which traps focus and closes on Escape.
// Render it conditionally: {isOpen && <Modal … />}.
export default function Modal({ title, onClose, children }) {
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
      className="m-auto max-h-[calc(100vh-3rem)] w-[min(560px,calc(100vw-2rem))] rounded-lg p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 id={titleId} className="text-[17px] font-semibold">
          {title}
        </h2>
        <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
