import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Ban } from 'lucide-react';
import { selectCurrentUser } from '../features/auth/authSlice';
import { cancelScan } from '../features/scans/scansThunks';
import { showToast } from '../features/ui/uiSlice';
import { useTranslation } from '../i18n';
import { can } from '../utils/roles';
import { useConfirm } from './ConfirmDialog';

export default function CancelScanButton({ scan, small = false }) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleCancel() {
    if (isCancelling) return;
    const confirmed = await confirm({
      title: t('scans.cancelTitle'),
      message: t('scans.cancelMessage', { id: scan.id, target: scan.targetName }),
      confirmLabel: t('scans.cancelConfirm'),
      danger: true,
    });
    if (!confirmed) return;
    setIsCancelling(true);
    try {
      await dispatch(cancelScan(scan.id)).unwrap();
      dispatch(showToast({ message: t('scans.cancelled', { id: scan.id }) }));
    } catch (error) {
      dispatch(showToast({ type: 'error', message: error.message }));
    } finally {
      setIsCancelling(false);
    }
  }

  if (!can(user, 'scans.cancel')) return null;

  return (
    <button
      type="button"
      className={`btn btn-danger ${small ? 'btn-sm' : ''}`}
      onClick={handleCancel}
      disabled={isCancelling}
      aria-label={small ? t('scans.cancelScanLabel', { id: scan.id }) : undefined}
    >
      <Ban size={16} aria-hidden="true" />
      {isCancelling ? t('scans.cancelling') : t('scans.stop')}
    </button>
  );
}
