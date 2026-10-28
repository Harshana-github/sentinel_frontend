import { useDispatch } from 'react-redux';
import { changeLanguage } from '../features/ui/uiSlice';
import { LANGUAGES, useTranslation } from '../i18n';

// 日本語 | English. Both names are always written in their own language, so anyone can find theirs.
export default function LanguageSwitcher() {
  const dispatch = useDispatch();
  const { t, language } = useTranslation();

  return (
    <div role="group" aria-label={t('common.language')} className="inline-flex rounded-md border border-slate-200 bg-surface p-0.5">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={language === code}
          onClick={() => dispatch(changeLanguage(code))}
          className={`cursor-pointer rounded px-2.5 py-1 text-xs font-semibold ${
            language === code ? 'bg-slate-900 text-slate-50' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
