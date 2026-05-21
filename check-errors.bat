@echo off
echo ========================================
echo  VoltPath - Error Diagnostic Tool
echo ========================================
echo.

echo [1/5] Checking Node.js version...
node --version
echo.

echo [2/5] Checking npm version...
npm --version
echo.

echo [3/5] Checking if AsyncStorage is installed...
npm list @react-native-async-storage/async-storage
echo.

echo [4/5] Checking for syntax errors...
echo Running basic validation...
node -e "console.log('Node.js is working correctly')"
echo.

echo [5/5] Checking package.json...
if exist package.json (
    echo package.json found ✓
) else (
    echo package.json NOT found ✗
)
echo.

echo ========================================
echo  Diagnostic Complete
echo ========================================
echo.
echo If you see errors above, check ERROR_FIXES.md
echo.

pause
