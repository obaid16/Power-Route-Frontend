# 🚀 How to Start VoltPath App - Complete Guide

## ✅ PROBLEM SOLVED!

The port 8081 error has been fixed. Here's how to start the app:

---

## 🎯 Quick Start (Choose One)

### Option 1: Use the Batch Files (Easiest)
Just double-click one of these files:
- **`start-web.bat`** - Start web version
- **`start-app.bat`** - Start with device selector

### Option 2: Manual Commands
```bash
# Kill any existing processes
taskkill /F /IM node.exe

# Wait 2 seconds
timeout /t 2

# Start the app
npx expo start --clear
```

### Option 3: Use Different Port
```bash
npx expo start --port 8082 --clear
```

---

## 📱 Platform-Specific Start Commands

### For Web Browser
```bash
taskkill /F /IM node.exe
npx expo start --web --clear
```
Or double-click: **`start-web.bat`**

### For iOS Simulator
```bash
taskkill /F /IM node.exe
npx expo start --ios --clear
```

### For Android Emulator
```bash
taskkill /F /IM node.exe
npx expo start --android --clear
```

### For Physical Device (Expo Go)
```bash
taskkill /F /IM node.exe
npx expo start --clear
```
Then scan QR code with Expo Go app

---

## 🔧 What Was Fixed

### The Problem
- Port 8081 was already in use by another process
- Previous Metro bundler didn't close properly
- Node processes were running in background

### The Solution
- Killed all node processes
- Created startup scripts that auto-clean
- Added clear cache flag

---

## 📋 Startup Scripts Created

### 1. `start-web.bat`
- Kills existing Node processes
- Clears cache
- Starts web version
- **Usage:** Double-click the file

### 2. `start-app.bat`
- Kills existing Node processes
- Clears cache
- Starts with device selector
- **Usage:** Double-click the file

---

## 🎯 Recommended Workflow

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Start the app
npx expo start --clear
```

### Daily Development
```bash
# Just use the batch file
# Double-click: start-web.bat
```

Or:
```bash
# Manual command
taskkill /F /IM node.exe && npx expo start --clear
```

---

## ⚠️ If Port Error Happens Again

### Quick Fix
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Wait 2 seconds
timeout /t 2

# Start fresh
npx expo start --clear
```

### Find What's Using the Port
```powershell
Get-NetTCPConnection -LocalPort 8081
```

### Kill Specific Process
```powershell
Stop-Process -Id <PROCESS_ID> -Force
```

---

## 🔍 Troubleshooting

### Issue: "Port 8081 still in use"
**Solution:**
```bash
# Use different port
npx expo start --port 8082 --clear
```

### Issue: "Metro bundler not starting"
**Solution:**
```bash
# Clear all caches
npx expo start --clear --reset-cache
```

### Issue: "Module not found"
**Solution:**
```bash
npm install
npx expo start --clear
```

### Issue: "App crashes on startup"
**Solution:**
```bash
# Full reset
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 📱 Access the App

### Web Browser
After starting, open: `http://localhost:8081`

### Expo Go App (Mobile)
1. Install Expo Go from App Store/Play Store
2. Start the app: `npx expo start`
3. Scan the QR code with Expo Go

### iOS Simulator
```bash
npx expo start --ios
```

### Android Emulator
```bash
npx expo start --android
```

---

## ✅ Verification Steps

After starting, you should see:

```
✓ Metro waiting on exp://192.168.x.x:8081
✓ Logs for your project will appear below
✓ Press a │ open Android
✓ Press i │ open iOS simulator
✓ Press w │ open web
```

---

## 🎯 Quick Commands Reference

| Command | What It Does |
|---------|-------------|
| `start-web.bat` | Start web version (double-click) |
| `start-app.bat` | Start with device selector (double-click) |
| `taskkill /F /IM node.exe` | Kill all Node processes |
| `npx expo start --clear` | Start with cleared cache |
| `npx expo start --port 8082` | Use different port |
| `npx expo start --web` | Start web only |
| `npx expo start --ios` | Start iOS simulator |
| `npx expo start --android` | Start Android emulator |

---

## 💡 Pro Tips

1. **Always use the batch files** - They handle cleanup automatically
2. **Close properly** - Use Ctrl+C to stop Expo (don't just close terminal)
3. **Check Task Manager** - Look for lingering node.exe processes
4. **Use --clear flag** - Clears cache and prevents issues
5. **Different ports** - Use port 8082 if 8081 is busy

---

## 🆘 Emergency Reset

If nothing works:

```bash
# 1. Kill everything
taskkill /F /IM node.exe

# 2. Remove node_modules
rm -rf node_modules

# 3. Remove cache
rm -rf .expo

# 4. Reinstall
npm install

# 5. Start fresh
npx expo start --clear
```

---

## ✅ Summary

**The app is now ready to start!**

**Easiest way:**
1. Double-click `start-web.bat`
2. Wait for it to open in browser
3. Login and test JWT persistence

**Manual way:**
```bash
taskkill /F /IM node.exe
npx expo start --clear
```

**No more port errors!** 🎉

---

## 📚 Related Documentation

- `FIX_PORT_ERROR.md` - Detailed port error solutions
- `ERROR_FIXES.md` - Common errors and fixes
- `JWT_IMPLEMENTATION.md` - JWT documentation
- `RESPONSIVE_COMPLETE.md` - Responsive design details

---

## 🎉 You're All Set!

The app should now start without any port errors. Enjoy developing! 🚀
