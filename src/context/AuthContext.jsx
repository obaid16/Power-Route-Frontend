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
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/apiClient';
import { getToken, setToken, clearToken, initializeToken } from '../services/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: restore persisted token on app start ──────────────────────
  const bootstrap = useCallback(async () => {
    // Initialize token from persistent storage
    await initializeToken();

    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api('/auth/me');
      setUser(res.data?.user ?? null);
    } catch {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

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
    await setToken(res.token);
    setUser(res.data?.user ?? null);
  }, []);

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const resendOtp = useCallback(async (email) => {
    await api('/auth/resend-otp', { method: 'POST', body: { email }, auth: false });
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    await setToken(res.token);
    setUser(res.data?.user ?? null);
  }, []);

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
      login, signup, verifyEmail, resendOtp, logout,
      isAuthenticated: Boolean(user),
      refreshUser: bootstrap,
    }),
    [user, loading, login, signup, verifyEmail, resendOtp, logout, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
