/**
 * Set in project root `.env` (loaded by Expo CLI):
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
 *   EXPO_PUBLIC_API_PREFIX=/api
 *
 * Restart `npx expo start` after changing .env.
 */
function stripTrailingSlash(url) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getApiOrigin() {
  const raw = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
  return stripTrailingSlash(raw || '') || 'http://localhost:5001';
}

export function getApiPrefix() {
  const p = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_PREFIX : undefined;
  if (p === '') return '';
  if (p === undefined || p === null) return '/api';
  return p.startsWith('/') ? p : `/${p}`;
}

export function getApiBaseUrl() {
  return `${getApiOrigin()}${getApiPrefix()}`;
}
