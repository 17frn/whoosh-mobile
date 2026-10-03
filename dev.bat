@echo off
REM Development environment loader for Windows
REM Usage: dev.bat

echo.
echo Loading .env.local...
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ERROR: .env.local not found!
    echo Please create .env.local with ANDROID_HOME path
    pause
    exit /b 1
)

REM Read .env.local and set environment variables
for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do (
    if not "%%a"=="" (
        if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
            echo OK %%a=%%b
        )
    )
)

echo.
echo OK Environment loaded!
echo.
echo Verify:
echo   ANDROID_HOME=%ANDROID_HOME%
echo.
echo Ready to run:
echo   npm run dev
echo   npx cap run android -l
echo.

REM Optional: Keep window open for inspection
pause
