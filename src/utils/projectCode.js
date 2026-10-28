// Project codes are short, unique (per organization) ids such as "WEB" or "MOBILE-API":
// uppercase letters, numbers and single hyphens, starting with a letter.
export const PROJECT_CODE_PATTERN = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;
export const PROJECT_CODE_MIN = 2;
export const PROJECT_CODE_MAX = 12;

// A first suggestion from the project name: the initials of its words ("Main Website" -> "MW"),
// or the start of a single word ("Storefront" -> "STOREF").
export function suggestProjectCode(name) {
  const words = (name ?? '').toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  const code = words.length > 1 ? words.map((word) => word[0]).join('') : (words[0] ?? '').slice(0, 6);
  return code.replace(/^[0-9]+/, '').slice(0, PROJECT_CODE_MAX);
}

// Returns the translation key of the problem, or '' when the code is valid.
export function projectCodeError(code) {
  if (!code) return 'validation.projectCodeRequired';
  if (code.length < PROJECT_CODE_MIN || code.length > PROJECT_CODE_MAX) return 'validation.projectCodeLength';
  if (!PROJECT_CODE_PATTERN.test(code)) return 'validation.projectCodeFormat';
  return '';
}
