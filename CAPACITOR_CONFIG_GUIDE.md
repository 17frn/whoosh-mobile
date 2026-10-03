# Panduan Capacitor Config (Debug vs Release)

## Overview
`capacitor.config.ts` sudah dikonfigurasi untuk detect environment secara otomatis:
- **Development** → Package name debug, live server enabled, DevTools on
- **Release** → Package name production, local app, DevTools off

## File Configuration

```typescript
// capacitor.config.ts
const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: isDev ? 'com.whoosh.app.debug' : 'com.whoosh.app',
  appName: isDev ? 'WHOOSH DEBUG' : 'WHOOSH',
  // ... rest config
};
```

---

## Package Names

### Debug Build
- **Package Name:** `com.whoosh.app.debug`
- **App Name:** `WHOOSH DEBUG`
- **Di Android:** Muncul dua icon aplikasi (debug + release tidak conflict)
- **Server:** Live dari `http://10.113.94.157:3000`
- **DevTools:** Enabled (WebContents Debugging)

### Release Build  
- **Package Name:** `com.whoosh.app`
- **App Name:** `WHOOSH`
- **Server:** Offline (built-in `dist/`)
- **DevTools:** Disabled

---

## Build Commands

### Development Build (Live Debug)
```bash
# 1. Start dev server
npm run dev

# 2. Build & sync Android
npx cap sync android

# 3. Build debug APK
cd android
./gradlew assembleDebug

# 4. Install
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Env Variable:** `NODE_ENV=development` (default saat npm run dev)

### Release Build (Production)
```bash
# 1. Production build
npm run build

# 2. Sync Android
npx cap sync android

# 3. Build release APK
cd android
./gradlew assembleRelease

# 4. Output
# android/app/build/outputs/apk/release/app-release.apk
```

**Env Variable:** `NODE_ENV=production` (saat npm run build)

---

## Konfigurasi Detail

### appId (Package Name)

#### Debug
```typescript
appId: 'com.whoosh.app.debug'
```
- Unik dan berbeda dari release
- Bisa install keduanya di HP bersamaan
- Tidak overwrite satu sama lain

#### Release
```typescript
appId: 'com.whoosh.app'
```
- Package name production
- Sesuai dengan yang didaftarkan di Google Play

### appName (Tampilan Nama di HP)

#### Debug
```typescript
appName: 'WHOOSH DEBUG'
```
- Jelas terlihat di launcher sebagai version debug
- Mudah dibedakan saat development

#### Release
```typescript
appName: 'WHOOSH'
```
- Nama final untuk user

### server (Live Development Server)

#### Debug
```typescript
server: {
  url: 'http://10.113.94.157:3000',
  cleartext: true,
  androidScheme: 'https'
}
```
- App akan load UI dari dev server (hot reload enabled)
- Ubah IP sesuai network baru
- `cleartext: true` = allow HTTP (non-HTTPS)

#### Release
```typescript
server: undefined  // Tidak ada server config
```
- App akan load dari built-in `dist/` folder
- Offline mode
- Faster load time

### webContentsDebuggingEnabled (DevTools)

#### Debug
```typescript
webContentsDebuggingEnabled: true
```
- Enable Chrome DevTools
- Inspect element, console logs, network inspector
- Remote debugging dari PC

#### Release
```typescript
webContentsDebuggingEnabled: false
```
- Disable untuk security & performance
- User tidak bisa inspect app

---

## Workflow Development

### Skenario 1: Ganti Network WiFi
```bash
# 1. Cek IP baru
npm run dev  # lihat output Vite

# 2. Update IP di capacitor.config.ts
# url: 'http://10.113.94.157:3000'  ← ubah ke IP baru

# 3. Sync & rebuild
npx cap sync android
cd android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk

# 4. Open app di HP - sudah connect ke network baru
```

### Skenario 2: Siap Release
```bash
# 1. Verify production build
npm run build

# 2. Check dist folder
ls -la dist/

# 3. Sync Android (akan pakai app-release config)
npx cap sync android

# 4. Build release APK
cd android
./gradlew assembleRelease

# 5. Sign & upload ke Play Store
# android/app/build/outputs/apk/release/app-release.apk
```

### Skenario 3: Test Release di Local
```bash
# Kalau mau test release build di HP dulu

# 1. Build release
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease

# 2. Install release APK
adb install app/build/outputs/apk/release/app-release.apk

# 3. Test di HP
# (Harus offline atau ada backend production)

# 4. Uninstall setelah test
adb uninstall com.whoosh.app
```

---

## File Locations

```
android/
├── app/
│   ├── build/
│   │   └── outputs/
│   │       └── apk/
│   │           ├── debug/
│   │           │   └── app-debug.apk           ← Development
│   │           └── release/
│   │               └── app-release.apk         ← Production
│   └── src/
│       ├── debug/                              ← Debug-specific resources
│       └── release/                            ← Release-specific resources
```

---

## Quick Reference

| Aspect | Debug | Release |
|--------|-------|---------|
| **Package Name** | `com.whoosh.app.debug` | `com.whoosh.app` |
| **App Name** | `WHOOSH DEBUG` | `WHOOSH` |
| **Server URL** | Live network IP | None (built-in) |
| **DevTools** | Enabled | Disabled |
| **Build Type** | `assembleDebug` | `assembleRelease` |
| **Output** | `app-debug.apk` | `app-release.apk` |
| **Install together** | ✅ Yes | ✅ Yes (diff package) |
| **Data shared** | ❌ No | ❌ No |

---

## Environment Variables

### Automatic Detection
```typescript
// NODE_ENV di-set otomatis:
// - npm run dev      → NODE_ENV = 'development'
// - npm run build    → NODE_ENV = 'production'
```

### Manual Override (Advanced)
```bash
# Force production config saat dev
NODE_ENV=production npm run dev

# Force debug config saat build
NODE_ENV=development npm run build
```

---

## Best Practices

1. ✅ **Jangan edit config manual** untuk tiap build
   - Let environment variable handle it automatically

2. ✅ **Keep debug & release terpisah**
   - Easy to test without affecting production
   - Data isolated

3. ✅ **Update IP hanya di development**
   - Production tidak perlu IP (offline)

4. ✅ **Always sync setelah edit capacitor.config.ts**
   ```bash
   npx cap sync android
   ```

5. ✅ **Test release build before uploading**
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew assembleRelease
   adb install app/build/outputs/apk/release/app-release.apk
   ```

---

## Troubleshooting

### Problem: App install tapi masih pake config lama
```bash
# Clear gradle cache
cd android
./gradlew clean
./gradlew assembleDebug
```

### Problem: Two apps dengan nama sama
```bash
# Pastikan appId berbeda di debug vs release
# Debug: com.whoosh.app.debug
# Release: com.whoosh.app
```

### Problem: Release app butuh backend tapi offline
```bash
# Option 1: Buat backend production URL di config
// capacitor.config.ts
const apiUrl = isDev 
  ? 'http://10.113.94.157:3000'
  : 'https://api.whoosh.app';

// Option 2: Use environment config
import.meta.env.VITE_API_URL
```

---

## Summary

✅ **Automatic environment detection**  
✅ **Two package names** - no conflicts  
✅ **Live development server** - hot reload  
✅ **Production ready** - offline capable  
✅ **DevTools** - enabled in debug only  

**Setiap build type otomatis menggunakan config yang tepat!**
