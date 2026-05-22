import { getApiBaseUrl } from '../config/env';
import { getToken, getRefreshToken, setToken, clearToken } from './tokenStorage';

let isRefreshing = false;
let refreshPromise = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token or null on failure.
 */
async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  // Deduplicate concurrent refresh attempts
  if (isRefreshing) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/auth/refresh-token`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return null;

      const newAccess = json.data?.accessToken || json.token;
      const newRefresh = json.data?.refreshToken || refreshToken;
      if (newAccess) {
        await setToken(newAccess, newRefresh);
        return newAccess;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  try {
    let res = await fetch(`${base}${p}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    // If we get a 401 and have a refresh token, try to silently refresh
    if (res.status === 401 && auth) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(`${base}${p}`, {
          method,
          headers,
          body: body != null ? JSON.stringify(body) : undefined,
        });
      }
    }

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
