# 🚀 Setup Instructions for Teammates

## Quick Start (3 Commands)

```bash
git pull origin main
npm install
npx expo start --clear
```

---

## What's New?

### ✨ New Features
1. **JWT Token Persistence** - Users stay logged in after refresh
2. **Fully Responsive Design** - Works on all screen sizes (phone, tablet, laptop, desktop)
3. **Improved UI Alignment** - Better layout across all screens

### 📦 New Dependencies
- `@react-native-async-storage/async-storage` - For persistent authentication

---

## Detailed Setup

### 1️⃣ Pull Latest Changes
```bash
git pull origin main
```

### 2️⃣ Install Dependencies
```bash
npm install
```
This installs the new AsyncStorage package needed for JWT persistence.

### 3️⃣ Start the App
```bash
npx expo start --clear
```
The `--clear` flag clears the cache to ensure a clean build.

---

## Platform-Specific Commands

### iOS
```bash
npx expo start --clear --ios
```

### Android
```bash
npx expo start --clear --android
```

### Web
```bash
npx expo start --clear --web
```

---

## Troubleshooting

### Problem: Module not found error
**Solution:**
```bash
npm install
npx expo start --clear
```

### Problem: App crashes or behaves unexpectedly
**Solution:** Clear everything and reinstall
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Problem: Git merge conflicts
**Solution:**
```bash
git stash                # Save your local changes
git pull origin main     # Pull latest changes
git stash pop           # Restore your changes
# Resolve conflicts manually if needed
```

---

## Testing the New Features

### Test JWT Persistence
1. Login to the app
2. Refresh the page or close/reopen the app
3. ✅ You should still be logged in (no need to login again!)

### Test Responsive Design
1. Open the app on different screen sizes
2. Resize the browser window (if on web)
3. ✅ Layout should adapt smoothly

---

## Documentation

- **PULL_CHANGES_GUIDE.md** - Detailed pull instructions
- **JWT_IMPLEMENTATION.md** - JWT technical documentation
- **RESPONSIVE_COMPLETE.md** - Responsive design details
- **QUICK_SETUP.txt** - Quick reference commands

---

## Need Help?

If you encounter any issues:

1. Check the documentation files listed above
2. Clear cache and reinstall: `rm -rf node_modules && npm install && npx expo start --clear`
3. Make sure you're on the correct branch
4. Verify Node.js version: `node --version` (should be 16+)

---

## Summary

**Just run these 3 commands:**
```bash
git pull origin main
npm install
npx expo start --clear
```

You're all set! 🎉
