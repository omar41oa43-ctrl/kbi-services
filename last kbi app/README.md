# KBI Technician

Flutter field-operations app for approved KBI technicians. It includes secure registration, job workflows, live availability/location, push notifications, document uploads, wallet history, and English/Arabic layout support.

## Local web run

```powershell
flutter pub get
flutter run -d chrome --dart-define=REQUIRE_EMAIL_VERIFICATION=false
```

Email verification is enabled by default. The override above is only for local accounts that predate verification.

## Required deployment configuration

Public Firebase web defaults are included for the `kbi2-f4f19` project. Register each native app in Firebase and pass its app ID at build time:

- `FIREBASE_ANDROID_APP_ID`
- `FIREBASE_IOS_APP_ID`
- `FIREBASE_MACOS_APP_ID`
- `FIREBASE_WEB_VAPID_KEY` for web push
- `GOOGLE_MAPS_API_KEY` as an Android environment variable and an iOS build setting

Optional Dart defines include `APP_ENVIRONMENT`, `SUPPORT_WHATSAPP`, `SUPPORT_EMAIL`, `OPERATIONS_EMAIL`, `PRIVACY_POLICY_URL`, `TERMS_URL`, and `REVIEW_URL`.

Restrict every Firebase/Maps public API key by application, domain/bundle ID, and API in the Google Cloud console. Never commit Android keystores, `key.properties`, APNs credentials, service-account keys, or native Firebase config files.

## Android release signing

Create `android/key.properties` locally:

```properties
storeFile=C:/secure/path/kbi-technician.jks
storePassword=...
keyAlias=...
keyPassword=...
```

Release builds are not silently signed with the debug key when this file is absent.

## Firebase backend

Install the Firebase CLI, authenticate, then deploy the callable functions and security configuration:

```powershell
Set-Location functions
npm install
Set-Location ..
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```

The client intentionally cannot write booking status, price, completion, history, location, device tokens, activation, or account deletion directly. Those operations are validated by callable functions.

Build the modular web messaging worker after changing Firebase web configuration:

```powershell
Set-Location tooling/firebase-sw
npm install
npm run build
```

## Verification

```powershell
dart format --output=none --set-exit-if-changed lib test
flutter analyze --no-fatal-infos
flutter test
flutter build web --release
node --check functions/index.js
```

Android builds require JDK 17. Windows desktop builds require Visual Studio with Desktop development with C++. iOS builds and signing require Xcode on macOS.
