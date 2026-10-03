# Project-Specific Environment Setup

## Konsep

Alih-alih mengatur ANDROID_HOME secara global (system-wide), kamu bisa set hanya untuk project ini dengan file `.env.local`.

**Keuntungan:**
- ✅ Tidak mengubah system environment
- ✅ Portable - bisa copy project ke komputer lain
- ✅ Multiple projects bisa punya Android SDK path berbeda
- ✅ Development isolated dari system

---

## Setup

### Step 1: Edit `.env.local`

File sudah dibuat di: `.env.local`

**Linux/Mac:**
```bash
ANDROID_HOME=$HOME/Android/Sdk
```

**Windows:**
```bash
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
```

**Custom location:**
```bash
ANDROID_HOME=/opt/android-sdk
```

### Step 2: Test Environment

**Linux/Mac:**
```bash
source dev.sh
# atau
bash dev.sh
```

**Windows:**
```bash
dev.bat
```

Output:
```
✅ Loading .env.local...
  ✅ ANDROID_HOME=/home/user/Android/Sdk
✅ Environment loaded!
```

---

## Usage

### Method 1: Manual (Load env, then command)

**Linux/Mac:**
```bash
# Terminal 1: Setup env + dev server
source dev.sh
npm run dev

# Terminal 2: Setup env + run android
source dev.sh
npx cap run android -l
```

**Windows:**
```bash
# Terminal 1
dev.bat
npm run dev

# Terminal 2
dev.bat
npx cap run android -l
```

### Method 2: npm scripts (Recommended)

**Linux/Mac:**
```bash
npm run setup:env   # Start dev server dengan env
npm run run:android # Live debug dengan env
npm run debug:sync  # Sync capacitor dengan env
```

**Windows:**
Buat `.cmd` wrapper:
```bash
@echo off
call dev.bat
%*
```

Atau langsung di terminal:
```bash
dev.bat && npm run dev
dev.bat && npx cap run android -l
```

---

## File Structure

```
project/
├── .env.local           ← Define ANDROID_HOME di sini
├── dev.sh              ← Load env (Linux/Mac)
├── dev.bat             ← Load env (Windows)
├── package.json        ← npm scripts
└── ...
```

---

## Environment Variables di `.env.local`

### Contoh - Lengkap

```bash
# Android SDK (required)
ANDROID_HOME=$HOME/Android/Sdk

# Optional: Custom paths
JAVA_HOME=$HOME/jdk-17
GRADLE_HOME=$HOME/gradle-8.0

# Optional: API backend
VITE_API_URL=http://10.113.94.157:3000

# Optional: Build flags
BUILD_TYPE=debug
```

### Parsing Rules

1. **Comments** dimulai dengan `#` - diabaikan
```bash
# This is a comment
ANDROID_HOME=$HOME/Android/Sdk  # Path ke SDK
```

2. **Empty lines** - diabaikan
```bash
ANDROID_HOME=$HOME/Android/Sdk

# Next line
JAVA_HOME=$HOME/jdk
```

3. **$HOME expansion** - `$HOME` jadi path home
```bash
# Jadi: /home/username/Android/Sdk
ANDROID_HOME=$HOME/Android/Sdk
```

4. **Whitespace trimmed** - spasi dibersihkan
```bash
ANDROID_HOME =  $HOME/Android/Sdk   # OK
# Jadi: ANDROID_HOME=$HOME/Android/Sdk
```

---

## Workflow Complete

### Initial Setup
```bash
# 1. Clone/create project
git clone <repo>
cd timeline-momen-app

# 2. Setup Node dependencies
npm install

# 3. Edit .env.local
# Ganti ANDROID_HOME sesuai komputer kamu
nano .env.local

# 4. Test
source dev.sh  # or dev.bat on Windows
echo $ANDROID_HOME
adb devices
```

### Daily Development
```bash
# Terminal 1: Dev Server
source dev.sh
npm run dev

# Terminal 2: Live Debug
source dev.sh
npx cap run android -l

# Or use npm scripts:
npm run setup:env    # Terminal 1
npm run run:android  # Terminal 2
```

### Build Release
```bash
source dev.sh
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

---

## Troubleshooting

### Problem: "command not found: dev.sh"

**Solution:**
```bash
# Make executable
chmod +x dev.sh

# Then run
./dev.sh  # atau source dev.sh

# Or use npm script
npm run setup:env
```

### Problem: ANDROID_HOME still not found

```bash
# Check .env.local
cat .env.local

# Verify path exists
ls -la $ANDROID_HOME/platforms

# Or manually test
source dev.sh
echo $ANDROID_HOME
adb --version
```

### Problem: adb not found after source dev.sh

```bash
# Check if path updated
echo $PATH | grep platform-tools

# Update dev.sh to include PATH
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Problem: Different Android SDK per team member

**Solution:**
1. Keep `.env.local` in `.gitignore`
```bash
echo ".env.local" >> .gitignore
git rm --cached .env.local
git commit -m "Remove .env.local"
```

2. Create `.env.local.example`
```bash
cp .env.local .env.local.example
# Edit example
nano .env.local.example
git add .env.local.example
```

3. Each team member:
```bash
cp .env.local.example .env.local
# Edit dengan path SDK mereka
nano .env.local
```

---

## .gitignore

Pastikan `.env.local` tidak di-commit:

```bash
# .gitignore
.env.local
.env.*.local
```

Tapi `dev.sh` dan `dev.bat` HARUS di-commit!

---

## npm Scripts Reference

```bash
# Development
npm run setup:env       # Load env + start dev server
npm run dev             # Just dev server

# Android Debug
npm run run:android     # Load env + live debug
npm run debug:sync      # Load env + sync capacitor
npm run debug:build     # Load env + build APK

# Release
npm run build           # Production build
npm run android:release # Build release APK
npm run android:debug   # Build debug APK (manual)
```

---

## Alternative: Load env in scripts

Jika prefer explicit approach, edit `package.json` scripts:

```json
{
  "scripts": {
    "dev": "source dev.sh && vite",
    "run:android": "source dev.sh && npx cap run android -l",
    "build": "source dev.sh && vue-tsc -b && vite build"
  }
}
```

Kemudian tinggal:
```bash
npm run dev
npm run run:android
npm run build
```

---

## Summary

✅ **Project-specific environment**
- `.env.local` → Define ANDROID_HOME
- `dev.sh` (Linux/Mac) / `dev.bat` (Windows) → Load env
- `package.json` scripts → Convenience commands

✅ **Workflow:**
1. Edit `.env.local` sekali
2. `source dev.sh` (or `dev.bat`)
3. `npm run dev` + `npm run run:android`
4. Done!

✅ **Benefits:**
- Tidak perlu system-wide env setup
- Portable antar komputer
- Team members bisa punya path berbeda
- Isolated development environment
