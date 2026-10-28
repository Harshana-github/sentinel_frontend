import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Check, Copy } from 'lucide-react';
import { showToast } from '../features/ui/uiSlice';

// Copies `value` to the clipboard. With `text` it shows a labelled button, otherwise a small icon button.
// `className` replaces the icon button's classes, e.g. for a dark background.
export default function CopyButton({ value, label, text, small = false, className }) {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      dispatch(showToast({ message: text ? 'Message copied. Paste it to send to the admin.' : 'Copied to clipboard.' }));
    } catch {
      dispatch(showToast({ type: 'error', message: 'Could not copy automatically. Select the text and copy it by hand.' }));
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button type="button" className={text ? `btn btn-secondary${small ? ' mt-1 self-start' : ''}` : (className ?? 'icon-btn')} aria-label={label} title={label} onClick={handleClick}>
      <Icon size={text ? 16 : 14} aria-hidden="true" />
      {text}
    </button>
  );
}
