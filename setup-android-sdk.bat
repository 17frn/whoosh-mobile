@echo off
REM Android SDK Setup Script for Windows
REM Jalankan: setup-android-sdk.bat

echo.
echo ===========================================
echo   Android SDK Environment Setup (Windows)
echo ===========================================
echo.

REM Check if ANDROID_HOME is already set
if defined ANDROID_HOME (
    echo OK ANDROID_HOME is set: %ANDROID_HOME%
) else (
    echo WARNING ANDROID_HOME is not set
    echo Searching for Android SDK...
    
    REM Check common locations
    if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
        set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
        echo Found at: !ANDROID_HOME!
    ) else if exist "%PROGRAMFILES%\Android\android-sdk" (
        set ANDROID_HOME=%PROGRAMFILES%\Android\android-sdk
        echo Found at: !ANDROID_HOME!
    ) else if exist "%PROGRAMFILES(x86)%\Android\android-sdk" (
        set ANDROID_HOME=%PROGRAMFILES(x86)%\Android\android-sdk
        echo Found at: !ANDROID_HOME!
    ) else (
        echo ERROR Android SDK not found!
        echo Please install Android Studio or Android SDK Command-line Tools
        echo https://developer.android.com/studio
        pause
        exit /b 1
    )
)

echo.
echo -----------------------------------------
echo   Setting up Environment Variables
echo -----------------------------------------
echo.

REM Set environment variables for current session
set ANDROID_SDK_ROOT=%ANDROID_HOME%

REM Add to PATH
set PATH=%PATH%;%ANDROID_HOME%\emulator
set PATH=%PATH%;%ANDROID_HOME%\platform-tools
set PATH=%PATH%;%ANDROID_HOME%\tools
set PATH=%PATH%;%ANDROID_HOME%\tools\bin

echo OK ANDROID_HOME=%ANDROID_HOME%
echo OK ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%
echo.

REM Permanent setup using setx (requires admin)
echo Setting up permanent environment variables...
echo Note: This requires Administrator privileges

REM Try to set permanently
setx ANDROID_HOME "%ANDROID_HOME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo OK ANDROID_HOME set permanently
) else (
    echo WARNING Could not set ANDROID_HOME permanently (needs admin)
    echo You can set it manually:
    echo   1. Right-click This PC - Properties
    echo   2. Advanced system settings - Environment Variables
    echo   3. New User Variable:
    echo      Name: ANDROID_HOME
    echo      Value: %ANDROID_HOME%
)

setx ANDROID_SDK_ROOT "%ANDROID_HOME%" >nul 2>&1

echo.
echo -----------------------------------------
echo   Verifying Installation
echo -----------------------------------------
echo.

REM Check adb
where adb >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo OK ADB found
    adb version | findstr /R "Android Debug Bridge"
) else (
    echo WARNING ADB not found in PATH
    echo It may be at: %ANDROID_HOME%\platform-tools\adb.exe
)

echo.

REM Check SDK
if exist "%ANDROID_HOME%\platforms" (
    echo OK Android SDK platforms found
    dir /b "%ANDROID_HOME%\platforms" | findstr /R "android"
) else (
    echo ERROR Android SDK platforms not found
)

echo.
echo ===========================================
echo   Setup Complete!
echo ===========================================
echo.
echo NEXT STEPS:
echo   1. Close and reopen Command Prompt/PowerShell
echo   2. Connect Android device via USB
echo   3. Run: npx cap run android -l
echo.
echo VERIFY SETUP:
echo   adb devices          - List connected devices
echo   echo %%ANDROID_HOME%% - Check env variable
echo.
pause
