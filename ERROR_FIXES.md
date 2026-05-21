# 🔧 Common Errors and Fixes

## 🚨 Error Diagnostics

### Step 1: Check What Error You Have
Look at your terminal/console and identify the error type below.

---

## 📋 Common Errors & Solutions

### ❌ Error: "Cannot find module '@react-native-async-storage/async-storage'"

**Solution:**
```bash
npm install @react-native-async-storage/async-storage
npx expo start --clear
```

---

### ❌ Error: "Invariant Violation" or "Element type is invalid"

**Solution:** Clear cache and restart
```bash
npx expo start --clear
```

Or full clean:
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

---

### ❌ Error: "AsyncStorage is not defined"

**Solution:** Make sure you're importing from the correct package
```javascript
// Correct:
import AsyncStorage from '@react-native-async-storage/async-storage';

// Wrong:
import { AsyncStorage } from 'react-native';
```

---

### ❌ Error: "useAuth must be used within AuthProvider"

**Solution:** Make sure AuthProvider wraps your app in App.js/index.js

Check that you have:
```javascript
<AuthProvider>
  <YourApp />
</AuthProvider>
```

---

### ❌ Error: "Network request failed" or "fetch failed"

**Solution:** Backend is not running or wrong API URL

1. Check backend is running:
```bash
cd backend
npm start
```

2. Check API URL in `.env` or `src/config/env.js`

---

### ❌ Error: Metro bundler issues

**Solution:**
```bash
# Kill all Metro processes
npx react-native start --reset-cache

# Or
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
npx expo start --clear
```

---

### ❌ Error: "Unable to resolve module"

**Solution:**
```bash
# Clear watchman
watchman watch-del-all

# Clear metro cache
rm -rf $TMPDIR/metro-*

# Reinstall
rm -rf node_modules
npm install

# Start fresh
npx expo start --clear
```

---

### ❌ Error: Git merge conflicts

**Solution:**
```bash
# Keep your changes
git stash
git pull origin main
git stash pop
git checkout --ours .
git add .
git commit -m "Resolved conflicts"
```

---

### ❌ Error: "Expo Go app crashes on startup"

**Solution:**
```bash
# Clear Expo cache
npx expo start --clear

# Or reinstall Expo Go app on your device
```

---

### ❌ Error: "Token is null" or "User not authenticated"

**Solution:** This is expected on first login. Just login again.

If persists:
```javascript
// Check tokenStorage.js has correct import
import AsyncStorage from '@react-native-async-storage/async-storage';
```

---

### ❌ Error: "Cannot read property 'user' of null"

**Solution:** Make sure you're using useAuth hook correctly:
```javascript
const { user, loading } = useAuth();

if (loading) return <LoadingScreen />;
if (!user) return <LoginScreen />;
```

---

### ❌ Error: Build/compile errors

**Solution:**
```bash
# Full clean and rebuild
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared
npm install
npx expo start --clear
```

---

## 🔍 Diagnostic Commands

### Check Installation
```bash
npm list @react-native-async-storage/async-storage
```
Should show version 2.x.x

### Check Node Version
```bash
node --version
```
Should be 16+ or 18+

### Check npm Version
```bash
npm --version
```
Should be 8+

### Check Expo Version
```bash
npx expo --version
```

### Check for Syntax Errors
```bash
npm run lint
```
(if you have linting configured)

---

## 🚀 Nuclear Option (Complete Reset)

If nothing works, do a complete reset:

```bash
# 1. Backup your .env file
cp .env .env.backup

# 2. Remove everything
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared
rm -rf package-lock.json

# 3. Reinstall
npm install

# 4. Restore .env
cp .env.backup .env

# 5. Start fresh
npx expo start --clear
```

---

## 📱 Platform-Specific Issues

### iOS Issues
```bash
# Clear iOS build
cd ios
rm -rf Pods
rm -rf build
pod install
cd ..
npx expo start --clear --ios
```

### Android Issues
```bash
# Clear Android build
cd android
./gradlew clean
cd ..
npx expo start --clear --android
```

### Web Issues
```bash
# Clear web cache
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear --web
```

---

## 🆘 Still Having Issues?

### Step 1: Identify the Error
Copy the exact error message from your terminal.

### Step 2: Check These Files
1. `src/services/tokenStorage.js` - Should have AsyncStorage import
2. `src/context/AuthContext.jsx` - Should import from tokenStorage
3. `package.json` - Should have @react-native-async-storage/async-storage

### Step 3: Run Diagnostics
```bash
# Check installation
npm list @react-native-async-storage/async-storage

# Check for errors
npm install

# Start with verbose logging
npx expo start --clear --verbose
```

### Step 4: Common Quick Fixes
```bash
# Quick fix 1: Clear cache
npx expo start --clear

# Quick fix 2: Reinstall dependencies
rm -rf node_modules && npm install

# Quick fix 3: Reset everything
rm -rf node_modules .expo && npm install && npx expo start --clear
```

---

## ✅ Verification Steps

After fixing, verify:

1. **App starts without errors**
```bash
npx expo start --clear
```

2. **Login works**
- Try logging in
- Should save token

3. **Token persists**
- Login
- Refresh app
- Should still be logged in

4. **No console errors**
- Check browser console (web)
- Check terminal output

---

## 📞 Quick Reference

| Issue | Command |
|-------|---------|
| Module not found | `npm install && npx expo start --clear` |
| Cache issues | `npx expo start --clear` |
| Build errors | `rm -rf node_modules && npm install` |
| Git conflicts | `git stash && git pull && git stash pop` |
| Complete reset | `rm -rf node_modules .expo && npm install` |

---

## 💡 Prevention Tips

1. Always run `npm install` after pulling changes
2. Use `--clear` flag when starting after changes
3. Keep Node.js and npm updated
4. Don't commit `node_modules` or `.expo` folders
5. Keep `.env` file backed up

---

## 🎯 Most Common Solution

90% of issues are solved by:
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

Try this first! 🚀
