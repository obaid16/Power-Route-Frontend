# JWT Token Persistence Implementation

## Overview
JWT (JSON Web Token) authentication has been implemented with persistent storage to maintain user sessions across app refreshes and restarts.

## What Was Changed

### 1. Token Storage (`src/services/tokenStorage.js`)
**Before:** Token was stored only in memory, lost on every refresh.

**After:** Token is now persisted using AsyncStorage with the following features:
- ✅ Persistent storage across app restarts
- ✅ Automatic token initialization on app start
- ✅ Synchronous token access for API calls
- ✅ Asynchronous token persistence
- ✅ Proper error handling

**New Functions:**
```javascript
initializeToken()  // Load token from storage on app start
getToken()         // Get current token (synchronous)
setToken(token)    // Save token to storage (async)
clearToken()       // Remove token from storage (async)
```

### 2. Auth Context (`src/context/AuthContext.jsx`)
**Updated to:**
- ✅ Initialize token from persistent storage on app start
- ✅ Use async token operations for login/signup/logout
- ✅ Clear token properly on logout or auth failure
- ✅ Maintain user session across app refreshes

### 3. Dependencies
**Added:**
- `@react-native-async-storage/async-storage` - Persistent key-value storage

## How It Works

### 1. App Startup Flow
```
App Starts
    ↓
AuthProvider initializes
    ↓
initializeToken() loads token from AsyncStorage
    ↓
If token exists → Fetch user data from /auth/me
    ↓
If valid → User logged in
If invalid → Clear token, show login
```

### 2. Login Flow
```
User enters credentials
    ↓
POST /auth/login
    ↓
Receive JWT token
    ↓
setToken() saves to AsyncStorage + memory
    ↓
User data stored in state
    ↓
Navigate to main app
```

### 3. Logout Flow
```
User clicks logout
    ↓
POST /auth/logout (optional)
    ↓
clearToken() removes from AsyncStorage + memory
    ↓
User state cleared
    ↓
Navigate to login screen
```

### 4. API Request Flow
```
API call initiated
    ↓
getToken() retrieves token from memory (fast)
    ↓
Add Authorization: Bearer <token> header
    ↓
Make request
    ↓
If 401 Unauthorized → Clear token, redirect to login
```

## Storage Key
- **Key:** `@voltpath_auth_token`
- **Location:** AsyncStorage (platform-specific secure storage)
- **Format:** JWT string

## Security Features

### ✅ Implemented
1. **Secure Storage**: Uses platform-native secure storage
2. **Token Validation**: Validates token on app start via `/auth/me` endpoint
3. **Automatic Cleanup**: Clears invalid tokens automatically
4. **Memory + Persistent**: Fast access (memory) + persistence (AsyncStorage)

### 🔒 Backend Requirements
The backend should implement:
1. **Token Expiration**: JWT tokens should have expiration time
2. **Token Refresh**: Optional refresh token mechanism
3. **Token Revocation**: Ability to invalidate tokens on logout
4. **Secure Endpoints**: Verify JWT signature on protected routes

## Usage Examples

### Check if User is Logged In
```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginScreen />;
  
  return <Dashboard user={user} />;
}
```

### Login
```javascript
const { login } = useAuth();

async function handleLogin() {
  try {
    await login(email, password);
    // Token automatically saved, user logged in
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}
```

### Logout
```javascript
const { logout } = useAuth();

async function handleLogout() {
  await logout();
  // Token automatically cleared, user logged out
}
```

### Make Authenticated API Call
```javascript
import { api } from './services/apiClient';

async function fetchUserData() {
  try {
    const response = await api('/user/profile');
    // Token automatically included in Authorization header
    return response.data;
  } catch (error) {
    console.error('API call failed:', error.message);
  }
}
```

## Testing

### Test Token Persistence
1. **Login** to the app
2. **Close** the app completely
3. **Reopen** the app
4. ✅ User should still be logged in

### Test Token Expiration
1. **Login** to the app
2. **Wait** for token to expire (backend configured time)
3. **Make an API call**
4. ✅ Should redirect to login screen

### Test Logout
1. **Login** to the app
2. **Logout**
3. **Reopen** the app
4. ✅ Should show login screen

## Troubleshooting

### Issue: User logged out after refresh
**Solution:** Check that AsyncStorage is properly installed and initialized

### Issue: Token not persisting
**Solution:** Check AsyncStorage permissions and storage quota

### Issue: 401 Unauthorized errors
**Solution:** 
- Check token expiration on backend
- Verify JWT signature validation
- Check Authorization header format

### Issue: Slow app startup
**Solution:** Token initialization is async but should be fast. Check network latency for `/auth/me` call.

## File Structure
```
VoltPath/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx          # Auth state management
│   ├── services/
│   │   ├── apiClient.js             # API client with JWT
│   │   └── tokenStorage.js          # JWT persistence
│   └── screens/
│       ├── LoginScreen.jsx          # Login UI
│       └── SplashScreen.jsx         # Initial loading
└── JWT_IMPLEMENTATION.md            # This file
```

## Benefits

✅ **No repeated logins** - Users stay logged in across app restarts  
✅ **Better UX** - Seamless authentication experience  
✅ **Secure** - Uses platform-native secure storage  
✅ **Fast** - Memory cache for quick token access  
✅ **Reliable** - Automatic token validation and cleanup  
✅ **Standard** - Uses industry-standard JWT authentication  

## Future Enhancements

### Optional Improvements
1. **Refresh Tokens**: Implement token refresh mechanism
2. **Biometric Auth**: Add fingerprint/face ID for re-authentication
3. **Token Encryption**: Encrypt token before storing (extra security layer)
4. **Multi-device Logout**: Invalidate tokens across all devices
5. **Session Management**: Track active sessions and devices

## Summary

JWT token persistence has been successfully implemented in VoltPath. Users will now remain logged in across app refreshes and restarts, providing a seamless authentication experience. The implementation uses AsyncStorage for persistent storage while maintaining fast synchronous access through memory caching.
