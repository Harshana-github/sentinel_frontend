import { useId, useRef, useState } from 'react';
import { ImageUp, X } from 'lucide-react';
import { useTranslation } from '../i18n';

const ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon';

// Picks an image and returns it as a data URL through onChange (null when removed).
// `maxKb` is checked here for quick feedback; the API checks it again.
export default function ImageUpload({ label, hint, value, onChange, maxKb, previewClassName = 'size-16' }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const id = useId();
  const [error, setError] = useState('');

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      setError(t('imageUpload.wrongType'));
      return;
    }
    if (file.size > maxKb * 1024) {
      setError(t('imageUpload.tooLarge', { size: Math.ceil(file.size / 1024), max: maxKb }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError('');
      onChange(reader.result);
    };
    reader.onerror = () => setError(t('imageUpload.unreadable'));
    reader.readAsDataURL(file);
  }

  return (
    <div className="mb-4">
      <p className="mb-1.5 font-medium" id={`${id}-label`}>
        {label}
      </p>
      <div className="flex items-center gap-4">
        <div
          className={`grid shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 ${previewClassName}`}
        >
          {value ? (
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageUp size={20} className="text-slate-400" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" aria-describedby={`${id}-label`} onClick={() => inputRef.current.click()}>
              {value ? t('imageUpload.replace') : t('imageUpload.upload')}
            </button>
            {value && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(null)}>
                <X size={14} aria-hidden="true" />
                {t('common.remove')}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">{hint ?? t('imageUpload.hint', { max: maxKb })}</p>
          {error && (
            <p className="text-[13px] text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} />
    </div>
  );
}
