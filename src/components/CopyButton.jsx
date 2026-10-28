import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Check, Copy } from 'lucide-react';
import { showToast } from '../features/ui/uiSlice';
import { useTranslation } from '../i18n';

// Copies `value` to the clipboard. With `text` it shows a labelled button, otherwise a small icon button.
// `className` replaces the icon button's classes, e.g. for a dark background.
export default function CopyButton({ value, label, text, small = false, className }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      dispatch(showToast({ message: text ? t('copy.messageCopied') : t('copy.copied') }));
    } catch {
      dispatch(showToast({ type: 'error', message: t('copy.failed') }));
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      className={text ? `btn btn-secondary${small ? ' mt-1 self-start' : ''}` : (className ?? 'icon-btn')}
      aria-label={label}
      title={label}
      onClick={handleClick}
    >
      <Icon size={text ? 16 : 14} aria-hidden="true" />
      {text}
    </button>
  );
}
