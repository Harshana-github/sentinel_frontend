// Slugs are the unique, URL-safe ids of records: lowercase letters, numbers and single hyphens.
// Other records refer to them, so a slug cannot change once the record exists.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 50;

export function slugify(text) {
  return (text ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, '');
}

// Returns an error message, or '' when the slug is valid.
export function slugError(slug) {
  if (!slug) return 'Enter a slug.';
  if (slug.length > SLUG_MAX_LENGTH) return `Use at most ${SLUG_MAX_LENGTH} characters.`;
  if (!SLUG_PATTERN.test(slug)) return 'Use lowercase letters, numbers and single hyphens only.';
  return '';
}
