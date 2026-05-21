import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@voltpath_auth_token';

// In-memory cache so synchronous getToken() works after the initial async load
let memoryToken = null;

/**
 * Call once at app startup (before AuthContext bootstrap runs).
 * Loads the persisted token into the in-memory cache.
 */
export async function initializeToken() {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    memoryToken = token || null;
    return memoryToken;
  } catch (error) {
    console.error('Failed to load token from storage:', error);
    memoryToken = null;
    return null;
  }
}

/** Alias for AuthContext compatibility */
export const loadToken = initializeToken;

/** Synchronous read from in-memory cache (populated by initializeToken on app start) */
export function getToken() {
  return memoryToken;
}

/**
 * Persist token to AsyncStorage AND update the in-memory cache.
 * Pass null/undefined to clear the token.
 */
export async function setToken(token) {
  memoryToken = token || null;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to save token to storage:', error);
  }
}

/**
 * Clear the JWT token — removes from AsyncStorage and clears cache.
 */
export async function clearToken() {
  memoryToken = null;
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear token from storage:', error);
  }
}
