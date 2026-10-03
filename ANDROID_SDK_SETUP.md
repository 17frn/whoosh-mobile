# Android SDK Setup Guide

## Error yang Kamu Alami

```
ERR_SDK_NOT_FOUND: No valid Android SDK root found.
```

Ini berarti sistem tidak bisa menemukan Android SDK. Solusi ada 2:

---

## Solusi 1: Auto Setup (Recommended)

### Linux / Mac
```bash
chmod +x setup-android-sdk.sh
bash setup-android-sdk.sh
```

### Windows
```bash
setup-android-sdk.bat
```

Script ini akan:
1. ✅ Cari Android SDK di lokasi standard
2. ✅ Setup ANDROID_HOME environment variable
3. ✅ Add ke PATH
4. ✅ Verify instalasi
5. ✅ Permanent konfigurasi

Setelah script selesai:
```bash
# Close & reopen terminal
# Cek verifikasi
echo $ANDROID_HOME  # Linux/Mac
echo %ANDROID_HOME% # Windows

# Test
adb devices
```

---

## Solusi 2: Manual Setup

### Step 1: Find Android SDK Location

#### Jika sudah install Android Studio
**Linux/Mac:**
```bash
# Cek di lokasi standard
ls -la ~/Android/Sdk

# Atau cari
find ~ -type d -name "Sdk" -path "*/Android/*" 2>/dev/null
```

**Windows:**
```bash
# Cek di AppData
dir %USERPROFILE%\AppData\Local\Android\Sdk

# Atau cek di Program Files
dir "C:\Program Files\Android\Android Studio\jre"
```

#### Jika belum install
1. Download Android Studio: https://developer.android.com/studio
2. Install
3. Launch → SDK Manager → Install SDK

### Step 2: Set ANDROID_HOME

#### Linux / Mac

Edit `~/.bashrc` atau `~/.zshrc`:
```bash
# Add lines
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Apply:
```bash
source ~/.bashrc
# atau untuk zsh
source ~/.zshrc
```

#### Windows

1. **Search:** "Edit environment variables for your account"
2. **Click:** "Environment Variables"
3. **Under "User variables"** → Click "New"
4. **Variable name:** `ANDROID_HOME`
5. **Variable value:** `C:\Users\YourUsername\AppData\Local\Android\Sdk`
6. **Click OK**

6. **Add to PATH:**
   - Select "Path" → Click "Edit"
   - Add new entries:
     - `C:\Users\YourUsername\AppData\Local\Android\Sdk\platform-tools`
     - `C:\Users\YourUsername\AppData\Local\Android\Sdk\tools`
     - `C:\Users\YourUsername\AppData\Local\Android\Sdk\emulator`
   - OK

7. **Restart terminal/IDE**

### Step 3: Verify

```bash
# Check env variable
echo $ANDROID_HOME  # Linux/Mac
echo %ANDROID_HOME% # Windows

# Check adb
which adb  # Linux/Mac
where adb  # Windows

# List devices
adb devices
```

Expected output:
```
C:\Users\YourUsername\AppData\Local\Android\Sdk  # atau /home/user/Android/Sdk

Android Debug Bridge version X.X.X

List of attached devices
device-name            device
```

---

## Quick Setup for Different OS

### macOS
```bash
# Assuming Android Studio installed
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Add to ~/.zshrc permanently
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
source ~/.zshrc
```

### Ubuntu / Linux
```bash
# Assuming Android Studio installed
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Add to ~/.bashrc permanently
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
source ~/.bashrc
```

### Windows PowerShell
```powershell
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"

# Permanent (run as admin):
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourUsername\AppData\Local\Android\Sdk", "User")
```

---

## Common Android SDK Paths

| OS | Path |
|---|---|
| **macOS** | `~/Library/Android/sdk` |
| **Ubuntu/Linux** | `~/Android/Sdk` |
| **Windows (AppData)** | `C:\Users\USERNAME\AppData\Local\Android\Sdk` |
| **Windows (ProgramFiles)** | `C:\Program Files\Android\android-sdk` |

---

## After Setup

### Test Live Debug
```bash
# 1. Start dev server
npm run dev

# 2. Connect device via USB
adb devices

# 3. Run live debug
npx cap run android -l

# Expected: App opens di HP dengan live reload
```

### Troubleshooting

#### Still getting ERR_SDK_NOT_FOUND
```bash
# Verify ANDROID_HOME is set
echo $ANDROID_HOME  # Should show path

# If empty, setup belum berhasil
# Check $ANDROID_HOME/platforms exists
ls $ANDROID_HOME/platforms

# Should list: android-29, android-30, android-31, dll
```

#### ADB not found
```bash
# Make sure PATH includes platform-tools
echo $PATH | grep platform-tools

# If not, add to ~/.bashrc or ~/.zshrc again
export PATH=$PATH:$ANDROID_HOME/platform-tools
source ~/.bashrc
```

#### Device not detected
```bash
# Enable USB debugging on device
# Settings → Developer Options → USB Debugging → ON

# Check connection
adb devices

# If shows "device" - OK
# If shows "offline" - disconnect/reconnect USB cable
# If shows "unauthorized" - Accept USB debugging prompt on device
```

---

## Environment Variables Check

### Linux/Mac
```bash
# Check all Android variables
env | grep -i android

# Output should show:
# ANDROID_HOME=/path/to/android/sdk
# ANDROID_SDK_ROOT=/path/to/android/sdk
```

### Windows
```bash
# Check variables
echo %ANDROID_HOME%
echo %ANDROID_SDK_ROOT%
echo %PATH%

# Should contain ANDROID_HOME path
```

---

## Permanent vs Temporary

### Temporary (Current Session Only)
```bash
export ANDROID_HOME=/path/to/sdk  # Hilang saat terminal ditutup
```

### Permanent (Recommended)

**Linux/Mac:**
Edit `~/.bashrc` atau `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

**Windows:**
Use "Edit Environment Variables" UI atau `setx` command

---

## Scripts Usage

### Linux/Mac
```bash
chmod +x setup-android-sdk.sh
bash setup-android-sdk.sh

# Script will:
# 1. Find SDK
# 2. Setup env vars
# 3. Update ~/.bashrc or ~/.zshrc
# 4. Verify
```

### Windows
```bash
# Run as Administrator (recommended)
setup-android-sdk.bat

# Script will:
# 1. Find SDK
# 2. Setup env vars temporarily
# 3. Try to set permanently with setx
# 4. Verify
```

---

## Summary

✅ **After setup selesai:**
- `npx cap run android -l` bisa langsung jalan
- Tidak perlu set environment variable manual setiap kali
- Live debugging bisa dijalankan dengan mudah

✅ **Workflow akan menjadi:**
```bash
npm run dev              # Terminal 1
npx cap run android -l   # Terminal 2
# App opens di HP with live reload!
```

Jika masih error, cek:
1. ✅ ANDROID_HOME env variable sudah set
2. ✅ $ANDROID_HOME/platforms folder exists
3. ✅ adb command bisa dijalankan
4. ✅ Device connected via USB (adb devices show "device")
