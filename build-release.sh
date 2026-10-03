#!/bin/bash
# ============================================================
#  WHOOSH — Build Release APK
#  Package: com.whoosh.app
#  Output:  android/app/build/outputs/apk/release/app-release-unsigned.apk
# ============================================================

set -e  # Hentikan script jika ada error

# ── Set Android SDK ──────────────────────────────────────────
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

# ── Warna output ─────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     WHOOSH — Build Release APK         ║${NC}"
echo -e "${BLUE}║     Package: com.whoosh.app            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Build Vue ─────────────────────────────────────────
echo -e "${YELLOW}[1/3] Building Vue production bundle...${NC}"
npm run build
echo -e "${GREEN}✔ Vue build selesai${NC}"
echo ""

# ── Step 2: Sync Capacitor ────────────────────────────────────
echo -e "${YELLOW}[2/3] Syncing Capacitor ke Android...${NC}"
npx cap sync android
echo -e "${GREEN}✔ Capacitor sync selesai${NC}"
echo ""

# ── Step 3: Gradle assembleRelease ───────────────────────────
echo -e "${YELLOW}[3/3] Building Release APK via Gradle...${NC}"
cd android
./gradlew assembleRelease
cd ..
echo ""

# ── Output info ───────────────────────────────────────────────
APK_PATH="android/app/build/outputs/apk/release/app-release-unsigned.apk"
SIGNED_APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
  echo -e "${YELLOW}[4/4] Signing APK...${NC}"
  # Buat debug keystore jika belum ada
  keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US" 2>/dev/null || true
  # Sign APK
  $ANDROID_HOME/build-tools/36.0.0/apksigner sign --ks ~/.android/debug.keystore --ks-pass pass:android --key-pass pass:android --out "$SIGNED_APK_PATH" "$APK_PATH"
  
  APK_SIZE=$(du -sh "$SIGNED_APK_PATH" | cut -f1)
  echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║         ✔ BUILD & SIGN BERHASIL!       ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  📦 APK   : ${BLUE}$SIGNED_APK_PATH${NC}"
  echo -e "  📏 Size  : ${BLUE}$APK_SIZE${NC}"
  echo -e "  🔑 Status: ${GREEN}Signed (Debug Key)${NC}"
  echo ""
  echo -e "  Untuk install langsung ke HP (USB Debug ON):"
  echo -e "  ${BLUE}adb install $SIGNED_APK_PATH${NC}"
else
  echo -e "${RED}✘ APK tidak ditemukan. Periksa error di atas.${NC}"
  exit 1
fi
