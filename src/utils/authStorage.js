// The demo keeps the session in localStorage so a page refresh does not log you out.
// A production build should prefer an httpOnly cookie set by the backend.
const STORAGE_KEY = 'sentinel_auth';

export function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredAuth(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
