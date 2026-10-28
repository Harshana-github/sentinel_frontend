// Light or dark colour theme, shown as a `dark` class on <html>.
// index.html applies the saved theme (or the OS setting) before the first paint, so the page
// never flashes the wrong colours. The choice is remembered in this browser.
const STORAGE_KEY = 'sentinel_theme';

export const readTheme = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

// Called when the user switches theme (see changeTheme in uiSlice).
export function storeTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked; the choice then lasts until the page is reloaded.
  }
}
