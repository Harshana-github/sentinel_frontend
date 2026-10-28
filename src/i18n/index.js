import { useSelector } from 'react-redux';
import { isSuperAdmin } from '../utils/roles';
import en from './en';
import ja from './ja';

// UI translations. Japanese is the default; the choice is remembered in this browser.
// Texts live in en.js and ja.js, grouped by screen. `t('projects.title')` looks a text up,
// `t('scans.queued', { id })` fills in {id}, and with { count: 1 } English uses the `_one` form.

export const LANGUAGES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
];

const DICTIONARIES = { ja, en };
const DEFAULT_LANGUAGE = 'ja';
const STORAGE_KEY = 'sentinel_language';

export function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return DICTIONARIES[stored] ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

// A copy outside React, for code without hooks such as the date formatters.
let currentLanguage = readStoredLanguage();
document.documentElement.lang = currentLanguage;

export const getLanguage = () => currentLanguage;

// Called when the user switches language (see changeLanguage in uiSlice).
export function storeLanguage(code) {
  currentLanguage = code;
  document.documentElement.lang = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage can be blocked; the choice then lasts until the page is reloaded.
  }
}

const lookup = (dictionary, key) => key.split('.').reduce((node, part) => node?.[part], dictionary);

export function translate(language, key, values = {}) {
  const dictionary = DICTIONARIES[language];
  const text = (values.count === 1 && lookup(dictionary, `${key}_one`)) || lookup(dictionary, key) || lookup(en, key);
  if (typeof text !== 'string') return key;
  return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}

// `localName(item)` shows the Japanese name of a master data item or status when the UI is
// Japanese and the item has one (`nameJa`, `descriptionJa`), otherwise its normal name.
export function useTranslation() {
  const language = useSelector((state) => state.ui.language);
  return {
    language,
    t: (key, values) => translate(language, key, values),
    localName: (item, field = 'name') => (language === 'ja' && item?.[`${field}Ja`]) || item?.[field] || '',
    // The signed-in user's role. The two built-in roles are translated; custom roles keep their name.
    roleName: (user) =>
      isSuperAdmin(user)
        ? translate(language, 'nav.adminPanel')
        : user?.roleSlug === 'admin'
          ? translate(language, 'organizations.adminRole')
          : (user?.role ?? ''),
  };
}
