@echo off
echo ========================================
echo  VoltPath - Starting Application
echo ========================================
echo.

echo [1/3] Killing existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Clearing cache...
echo.

echo [3/3] Starting Expo...
echo.
npx expo start --clear

pause
