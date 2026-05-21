# 🔧 Fix Port 8081 Already in Use Error

## ❌ Error
```
Port 8081 is being used by another process
```

---

## ✅ Quick Solutions

### Solution 1: Kill the Process Using Port 8081 (Recommended)
```powershell
# Find the process
Get-NetTCPConnection -LocalPort 8081 | Select-Object OwningProcess

# Kill it (replace XXXX with the process ID from above)
Stop-Process -Id XXXX -Force

# Or kill all node processes
taskkill /F /IM node.exe

# Then start your app
npx expo start --clear
```

### Solution 2: Use a Different Port
```bash
npx expo start --port 8082 --clear
```

### Solution 3: Kill All Metro/Expo Processes
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Kill all expo processes
Get-Process | Where-Object {$_.ProcessName -like "*expo*"} | Stop-Process -Force

# Then start fresh
npx expo start --clear
```

---

## 🎯 Step-by-Step Fix

### Step 1: Kill the Process
```powershell
# Kill all node processes
taskkill /F /IM node.exe
```

### Step 2: Clear Cache
```bash
npx expo start --clear
```

### Step 3: If Still Issues, Use Different Port
```bash
npx expo start --port 8082 --clear
```

---

## 🔍 Find What's Using the Port

### Windows PowerShell
```powershell
Get-NetTCPConnection -LocalPort 8081 | Select-Object OwningProcess
```

### Windows CMD
```cmd
netstat -ano | findstr :8081
```

Then kill the process:
```cmd
taskkill /PID <process_id> /F
```

---

## 🚀 One-Liner Solutions

### Kill Node and Start Fresh
```powershell
taskkill /F /IM node.exe; npx expo start --clear
```

### Use Different Port
```bash
npx expo start --port 8082 --clear --web
```

### Kill Specific Process (if you know the PID)
```powershell
Stop-Process -Id 12736 -Force; npx expo start --clear
```

---

## 📱 Platform-Specific Commands

### For Web
```bash
# Kill node processes
taskkill /F /IM node.exe

# Start on different port
npx expo start --web --port 8082 --clear
```

### For iOS
```bash
taskkill /F /IM node.exe
npx expo start --ios --clear
```

### For Android
```bash
taskkill /F /IM node.exe
npx expo start --android --clear
```

---

## 🛠️ Prevent This Issue

### Option 1: Always Kill Before Starting
Create a script `start-clean.bat`:
```batch
@echo off
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
npx expo start --clear
```

Then run: `start-clean.bat`

### Option 2: Use Different Port by Default
Add to `package.json`:
```json
{
  "scripts": {
    "start": "expo start --port 8082",
    "web": "expo start --web --port 8082"
  }
}
```

---

## ⚠️ Common Causes

1. **Previous Expo/Metro process didn't close properly**
2. **Another app using port 8081** (common with React Native)
3. **Multiple terminal windows running Expo**
4. **Crashed Metro bundler still running in background**

---

## 🔄 Complete Reset

If nothing works:

```powershell
# 1. Kill all node processes
taskkill /F /IM node.exe

# 2. Kill all expo processes
Get-Process | Where-Object {$_.ProcessName -like "*expo*"} | Stop-Process -Force

# 3. Clear all caches
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force $env:TEMP\metro-*
Remove-Item -Recurse -Force $env:TEMP\haste-*

# 4. Reinstall
npm install

# 5. Start fresh
npx expo start --clear
```

---

## ✅ Recommended Solution for Your Case

Since process 12736 is using port 8081:

```powershell
# Kill the specific process
Stop-Process -Id 12736 -Force

# Or kill all node processes
taskkill /F /IM node.exe

# Wait 2 seconds
Start-Sleep -Seconds 2

# Start fresh
npx expo start --clear
```

---

## 🎯 Quick Commands Reference

| Command | What It Does |
|---------|-------------|
| `taskkill /F /IM node.exe` | Kill all Node processes |
| `Stop-Process -Id XXXX -Force` | Kill specific process |
| `npx expo start --port 8082` | Use different port |
| `npx expo start --clear` | Start with cleared cache |
| `Get-NetTCPConnection -LocalPort 8081` | Find what's using port |

---

## 💡 Pro Tips

1. **Always close previous Expo instances before starting new ones**
2. **Use Ctrl+C to properly stop Expo** (don't just close terminal)
3. **Check Task Manager** for lingering node.exe processes
4. **Use different ports** for different projects
5. **Create cleanup scripts** for easy resets

---

## 🆘 Still Not Working?

Try this nuclear option:

```powershell
# Kill everything
taskkill /F /IM node.exe
taskkill /F /IM expo.exe
Get-Process | Where-Object {$_.ProcessName -like "*metro*"} | Stop-Process -Force

# Wait
Start-Sleep -Seconds 3

# Restart computer (if really stuck)
# Then try again
npx expo start --clear --port 8082
```

---

## ✅ After Fixing

Verify it works:
```bash
npx expo start --clear
```

Should see:
```
✓ Metro waiting on exp://...
✓ Logs for your project will appear below
```

No more port errors! 🎉
