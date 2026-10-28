import { createContext, useCallback, useContext, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useTranslation } from '../i18n';
import Modal from './Modal';

const ConfirmContext = createContext(null);

// A confirmation dialog in place of window.confirm, which looks out of place and cannot be
// translated. Usage: `const confirm = useConfirm();`
// `if (!(await confirm({ title, message, confirmLabel, danger: true }))) return;`
export function ConfirmProvider({ children }) {
  const { t } = useTranslation();
  const [request, setRequest] = useState(null);

  const confirm = useCallback((options) => new Promise((resolve) => setRequest({ ...options, resolve })), []);

  function close(result) {
    request.resolve(result);
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal title={request.title} size="sm" onClose={() => close(false)}>
          <div className="flex gap-3">
            {request.danger && (
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-600" aria-hidden="true">
                <TriangleAlert size={18} />
              </span>
            )}
            <p className="pt-1.5 whitespace-pre-line">{request.message}</p>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => close(false)}>
              {request.cancelLabel ?? t('common.cancel')}
            </button>
            <button
              type="button"
              className={request.danger ? 'btn bg-red-600 text-white enabled:hover:bg-red-700 dark:enabled:hover:bg-red-500' : 'btn btn-primary'}
              autoFocus
              onClick={() => close(true)}
            >
              {request.confirmLabel ?? t('common.ok')}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
