@echo off
echo ========================================
echo  VoltPath - Starting Web Version
echo ========================================
echo.

echo [1/3] Killing existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Clearing cache...
echo.

echo [3/3] Starting Expo Web...
echo.
npx expo start --web --clear

pause
