import { getApiBaseUrl } from '../config/env';
import { getToken } from './tokenStorage';

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(`${base}${p}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || res.statusText || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return json;
  } catch (e) {
    if (e.status) throw e;
    throw new Error(e.message || 'Network error — is the backend running?');
  }
}

/** @deprecated use api() */
export async function apiGet(path, options = {}) {
  return api(path, { ...options, method: 'GET' });
}

export { getApiBaseUrl };
