import { useTranslation } from '../i18n';
import FormField, { errorProps } from './FormField';

// Name and description in English and Japanese, side by side, for data the Super Admin
// manages (master data, statuses, modules, permissions). The English name is required and
// used for the slug; the Japanese texts are shown when the UI is in Japanese.
// `form` holds name, nameJa, description and descriptionJa; `onChange(field, value)` updates one.
export default function BilingualFields({ id, form, onChange, nameError, nameHint }) {
  const { t } = useTranslation();
  const input = (field, extra = {}) => ({
    id: `${id}-${field}`,
    className: 'input',
    value: form[field] ?? '',
    onChange: (event) => onChange(field, event.target.value),
    ...extra,
  });

  return (
    <>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <FormField id={`${id}-name`} label={t('bilingual.nameEn')} required hint={nameHint} error={nameError}>
          <input {...input('name', { autoFocus: true })} {...errorProps(`${id}-name`, nameError)} />
        </FormField>
        <FormField id={`${id}-nameJa`} label={t('bilingual.nameJa')} optional>
          <input {...input('nameJa')} lang="ja" />
        </FormField>
      </div>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <FormField id={`${id}-description`} label={t('bilingual.descriptionEn')} optional>
          <textarea {...input('description', { className: 'input h-auto py-2', rows: 2 })} />
        </FormField>
        <FormField id={`${id}-descriptionJa`} label={t('bilingual.descriptionJa')} optional>
          <textarea {...input('descriptionJa', { className: 'input h-auto py-2', rows: 2 })} lang="ja" />
        </FormField>
      </div>
    </>
  );
}
