import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@voltpath_auth_token';
const REFRESH_TOKEN_KEY = '@voltpath_refresh_token';

// In-memory cache so synchronous getToken() works after the initial async load
let memoryAccessToken = null;
let memoryRefreshToken = null;

/**
 * Call once at app startup (before AuthContext bootstrap runs).
 * Loads the persisted tokens into the in-memory cache.
 */
export async function initializeToken() {
  try {
    const [access, refresh] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
    ]);
    memoryAccessToken = access || null;
    memoryRefreshToken = refresh || null;
    return memoryAccessToken;
  } catch (error) {
    console.error('Failed to load tokens from storage:', error);
    memoryAccessToken = null;
    memoryRefreshToken = null;
    return null;
  }
}

/** Alias for AuthContext compatibility */
export const loadToken = initializeToken;

/** Synchronous read from in-memory cache */
export function getToken() {
  return memoryAccessToken;
}

/** Synchronous read of refresh token from in-memory cache */
export function getRefreshToken() {
  return memoryRefreshToken;
}

/**
 * Persist access token (and optionally refresh token) to AsyncStorage
 * AND update the in-memory cache.
 * Pass null/undefined to clear.
 */
export async function setToken(accessToken, refreshToken) {
  memoryAccessToken = accessToken || null;
  try {
    if (accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to save access token to storage:', error);
  }

  // Only update refresh token if explicitly provided
  if (refreshToken !== undefined) {
    memoryRefreshToken = refreshToken || null;
    try {
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to save refresh token to storage:', error);
    }
  }
}

/**
 * Clear both JWT tokens — removes from AsyncStorage and clears cache.
 */
export async function clearToken() {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  try {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.error('Failed to clear tokens from storage:', error);
  }
}
