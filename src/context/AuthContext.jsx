/**
 * AuthContext — VoltPath mobile
 *
 * Signup flow:
 *  1. signup(name, email, phone, password) → backend sends OTP email
 *  2. verifyEmail(email, otp)              → verifies OTP, stores JWT, sets user
 *  3. resendOtp(email)                     → resends OTP
 *
 * Login flow:
 *  login(email, password) → JWT + user
 *
 * Session persistence:
 *  On app start / browser refresh, the stored refresh token is used to
 *  silently restore the session without requiring re-login.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/apiClient';
import { getToken, getRefreshToken, setToken, clearToken, initializeToken } from '../services/tokenStorage';
import { getApiBaseUrl } from '../config/env';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: restore persisted token on app start ──────────────────────
  const bootstrap = useCallback(async () => {
    // Initialize tokens from persistent storage
    await initializeToken();

    const accessToken = getToken();
    const refreshToken = getRefreshToken();

    // No tokens at all → not logged in
    if (!accessToken && !refreshToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Try fetching user with current access token
    if (accessToken) {
      try {
        const res = await api('/auth/me');
        setUser(res.data?.user ?? null);
        setLoading(false);
        return;
      } catch {
        // Access token expired or invalid — fall through to refresh
      }
    }

    // Try refreshing the session using the refresh token
    if (refreshToken) {
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/auth/refresh-token`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.data?.accessToken) {
          await setToken(json.data.accessToken, json.data.refreshToken || refreshToken);
          // Now fetch user profile with the fresh token
          try {
            const meRes = await api('/auth/me');
            setUser(meRes.data?.user ?? null);
            setLoading(false);
            return;
          } catch {
            // Even with new token, /me failed
          }
        }
      } catch {
        // Refresh failed
      }
    }

    // All attempts failed → clear stale tokens and show login
    await clearToken();
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  // ── Helper: extract and store tokens from backend response ───────────────
  const storeTokens = useCallback(async (res) => {
    const accessToken = res.token || res.data?.accessToken;
    const refreshToken = res.data?.refreshToken;
    await setToken(accessToken, refreshToken);
  }, []);

  // ── Step 1: Register → sends OTP email ───────────────────────────────────
  const signup = useCallback(async (name, email, phone, password) => {
    await api('/auth/signup', {
      method: 'POST',
      body: { name, email, phone, password },
      auth: false,
    });
    // Returns { email, otpSent: true } — no token yet
  }, []);

  // ── Step 2: Verify OTP → get JWT ─────────────────────────────────────────
  const verifyEmail = useCallback(async (email, otp) => {
    const res = await api('/auth/verify-email', {
      method: 'POST',
      body: { email, otp },
      auth: false,
    });
    await storeTokens(res);
    setUser(res.data?.user ?? null);
  }, [storeTokens]);

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const resendOtp = useCallback(async (email) => {
    await api('/auth/resend-otp', { method: 'POST', body: { email }, auth: false });
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    await storeTokens(res);
    setUser(res.data?.user ?? null);
  }, [storeTokens]);

  // ── Social Login ──────────────────────────────────────────────────────────
  const socialLogin = useCallback(async (email, name, id, provider) => {
    const res = await api('/auth/social-login', {
      method: 'POST',
      body: { email, name, id, provider },
      auth: false,
    });
    await storeTokens(res);
    setUser(res.data?.user ?? null);
  }, [storeTokens]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user, loading,
      login, signup, verifyEmail, resendOtp, logout, socialLogin,
      isAuthenticated: Boolean(user),
      refreshUser: bootstrap,
    }),
    [user, loading, login, signup, verifyEmail, resendOtp, logout, socialLogin, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
