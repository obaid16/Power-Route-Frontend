# Pull Changes Guide for Teammates

## 📥 Commands to Pull Latest Changes

### Step 1: Pull the Latest Code
```bash
git pull origin main
```
*Or replace `main` with your branch name (e.g., `master`, `develop`)*

### Step 2: Install New Dependencies
```bash
npm install
```
*This will install the new `@react-native-async-storage/async-storage` package*

### Step 3: Clear Cache (Recommended)
```bash
npx expo start --clear
```
*This clears the Metro bundler cache to ensure clean build*

---

## 🚀 Quick Start (All Commands)

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Start the app with cleared cache
npx expo start --clear
```

---

## 📱 Platform-Specific Commands

### For iOS
```bash
git pull origin main
npm install
npx expo start --clear --ios
```

### For Android
```bash
git pull origin main
npm install
npx expo start --clear --android
```

### For Web
```bash
git pull origin main
npm install
npx expo start --clear --web
```

---

## 🔍 What Changed?

### New Features
✅ **JWT Token Persistence** - Users stay logged in after refresh
✅ **Fully Responsive Design** - Optimized for all screen sizes
✅ **Improved Alignment** - Better layout on all screens

### New Dependencies
- `@react-native-async-storage/async-storage` - For persistent token storage

### Modified Files
- `src/services/tokenStorage.js` - JWT persistence
- `src/context/AuthContext.jsx` - Auth flow updates
- Multiple screen and component files - Responsive design
- `package.json` - New dependency added

---

## ⚠️ Troubleshooting

### Issue: "Module not found: @react-native-async-storage/async-storage"
**Solution:**
```bash
npm install
npx expo start --clear
```

### Issue: App crashes after pulling changes
**Solution:**
```bash
# Clear all caches
rm -rf node_modules
npm install
npx expo start --clear
```

### Issue: Git conflicts
**Solution:**
```bash
# Stash your local changes
git stash

# Pull latest changes
git pull origin main

# Apply your stashed changes
git stash pop

# Resolve conflicts if any
```

### Issue: Old cache causing issues
**Solution:**
```bash
# Clear Metro bundler cache
npx expo start --clear

# Or clear all caches
watchman watch-del-all  # If you have watchman installed
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

---

## 📋 Verification Steps

After pulling and installing, verify everything works:

### 1. Check Dependencies
```bash
npm list @react-native-async-storage/async-storage
```
Should show the package is installed.

### 2. Test JWT Persistence
1. Login to the app
2. Refresh the page/app
3. ✅ You should still be logged in

### 3. Test Responsive Design
1. Open the app on different screen sizes
2. ✅ Layout should adapt properly

---

## 🆘 Need Help?

If you encounter any issues:

1. **Check the documentation:**
   - `JWT_IMPLEMENTATION.md` - JWT details
   - `RESPONSIVE_COMPLETE.md` - Responsive design details

2. **Clear everything and start fresh:**
   ```bash
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```

3. **Check your Node/npm versions:**
   ```bash
   node --version  # Should be 16+ 
   npm --version   # Should be 8+
   ```

---

## 📝 Summary

**Minimum Required Commands:**
```bash
git pull origin main
npm install
npx expo start --clear
```

That's it! Your local environment should now be up to date with all the latest changes.
