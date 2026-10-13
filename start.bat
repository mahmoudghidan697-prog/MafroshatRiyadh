@echo off
chcp 65001 >nul
title Mafroshat Al Saree - Website

cd /d "G:\hermez\mafroshat-al-saree" || (echo ERROR: folder not found & pause & exit /b 1)

REM ==== First run only: install dependencies ====
if not exist "node_modules" (
    echo Installing dependencies - first run only, please wait...
    call npm install
)

REM ==== Build once (production build - reliable CSS, fast runtime) ====
REM NOTE: we run `next build` + `next start` instead of `next dev` because
REM the dev server was serving a stale/empty CSS file in this environment.
call npm run build

echo.
echo ============================================
echo    Website:   http://localhost:3000
echo    Admin:     http://localhost:3000/admin
echo              ^(admin / admin123^)
echo.
echo    Press Ctrl+C to stop the server
echo ============================================
echo.

REM ==== Open the HOMEPAGE after the server starts ====
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

call npm run start

pause
