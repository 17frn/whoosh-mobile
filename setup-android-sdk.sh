#!/bin/bash

# Android SDK Setup Script
# Jalankan: bash setup-android-sdk.sh

echo "═══════════════════════════════════════"
echo "  Android SDK Environment Setup"
echo "═══════════════════════════════════════"
echo ""

# Detect OS
OS_TYPE=$(uname -s)
echo "📱 Detected OS: $OS_TYPE"
echo ""

# Function untuk detect Android SDK di berbagai lokasi umum
find_android_sdk() {
  local possible_paths=(
    "$HOME/Android/Sdk"
    "$HOME/.android/sdk"
    "$HOME/Library/Android/sdk"  # Mac
    "/opt/android-sdk"
    "/opt/android"
  )
  
  for path in "${possible_paths[@]}"; do
    if [ -d "$path/platforms" ]; then
      echo "$path"
      return 0
    fi
  done
  
  return 1
}

# Cek apakah ANDROID_HOME sudah set
if [ -z "$ANDROID_HOME" ]; then
  echo "⚠️  ANDROID_HOME tidak ditemukan. Searching..."
  ANDROID_SDK=$(find_android_sdk)
  
  if [ -z "$ANDROID_SDK" ]; then
    echo "❌ Android SDK tidak ditemukan di lokasi standard!"
    echo ""
    echo "Silakan install Android SDK terlebih dahulu:"
    echo "  1. Download Android Studio dari https://developer.android.com"
    echo "  2. Install Android SDK via SDK Manager"
    echo "  3. Atau gunakan command line tools"
    exit 1
  else
    echo "✅ Found Android SDK at: $ANDROID_SDK"
    ANDROID_HOME=$ANDROID_SDK
  fi
else
  echo "✅ ANDROID_HOME is set: $ANDROID_HOME"
fi

echo ""
echo "─────────────────────────────────────"
echo "  Setting up Environment Variables"
echo "─────────────────────────────────────"
echo ""

# Tentukan shell config file
if [ "$OS_TYPE" = "Darwin" ]; then
  # Mac - check untuk zsh atau bash
  if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
  else
    SHELL_RC="$HOME/.bash_profile"
  fi
elif [ "$OS_TYPE" = "Linux" ]; then
  if [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
  else
    SHELL_RC="$HOME/.bash_profile"
  fi
else
  SHELL_RC="$HOME/.bashrc"
fi

echo "📝 Shell config file: $SHELL_RC"
echo ""

# Setup ANDROID_HOME
if ! grep -q "ANDROID_HOME" "$SHELL_RC"; then
  echo "Adding ANDROID_HOME to $SHELL_RC..."
  echo "" >> "$SHELL_RC"
  echo "# Android SDK Setup" >> "$SHELL_RC"
  echo "export ANDROID_HOME=\"$ANDROID_HOME\"" >> "$SHELL_RC"
  echo "export ANDROID_SDK_ROOT=\"$ANDROID_HOME\"" >> "$SHELL_RC"
  echo "export PATH=\"\$PATH:\$ANDROID_HOME/emulator\"" >> "$SHELL_RC"
  echo "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\"" >> "$SHELL_RC"
  echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools\"" >> "$SHELL_RC"
  echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools/bin\"" >> "$SHELL_RC"
  echo "✅ Added ANDROID_HOME variables"
else
  echo "✅ ANDROID_HOME already configured"
fi

echo ""
echo "─────────────────────────────────────"
echo "  Verifying Installation"
echo "─────────────────────────────────────"
echo ""

# Source the config untuk current session
source "$SHELL_RC"

# Check adb
if command -v adb &> /dev/null; then
  echo "✅ ADB found at: $(which adb)"
  adb version | head -1
else
  echo "⚠️  ADB not found in PATH"
fi

echo ""

# Check SDK
if [ -d "$ANDROID_HOME/platforms" ]; then
  echo "✅ Android SDK platforms found"
  ls "$ANDROID_HOME/platforms" | head -3
else
  echo "❌ Android SDK platforms not found"
fi

echo ""

# Check emulator
if [ -d "$ANDROID_HOME/emulator" ]; then
  echo "✅ Android Emulator found"
else
  echo "⚠️  Android Emulator not found (optional)"
fi

echo ""
echo "═══════════════════════════════════════"
echo "  Setup Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "📌 Next steps:"
echo "  1. Close and reopen terminal"
echo "  2. Connect Android device via USB"
echo "  3. Run: npx cap run android -l"
echo ""
echo "💡 To verify setup:"
echo "  adb devices        # List connected devices"
echo "  echo \$ANDROID_HOME # Check env variable"
echo ""
