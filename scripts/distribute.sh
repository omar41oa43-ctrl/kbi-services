#!/usr/bin/env bash
# ==============================================================================
# KBI Technician App — Firebase App Distribution Automated Release Script
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${ROOT_DIR}/kbi_technician_app"
FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID:-kbi2-f4f19}"
FIREBASE_APP_ID="${FIREBASE_APP_ID:-1:1078380307626:android:5df8faeb875a00defa9cd3}"
TESTER_GROUP="${TESTER_GROUP:-kbi-technicians}"
RELEASE_NOTES_FILE="${ROOT_DIR}/scripts/release-notes.txt"
TESTERS_FILE="${ROOT_DIR}/scripts/testers.txt"

echo "========================================================"
echo "🚀 KBI Technician App: Firebase App Distribution"
echo "========================================================"
echo "Project ID:    ${FIREBASE_PROJECT_ID}"
echo "App ID:        ${FIREBASE_APP_ID}"
echo "Target Group:  ${TESTER_GROUP}"
echo "========================================================"

# Step 1: Check Firebase CLI authentication
echo "1️⃣  Verifying Firebase CLI..."
if ! npx -y firebase-tools@latest projects:list >/dev/null 2>&1; then
  echo "⚠️  Firebase CLI is not logged in. Please run: npx -y firebase-tools@latest login"
  exit 1
fi
echo "   ✓ Firebase CLI authenticated."

# Step 2: Build or locate Release APK
APK_PATH="${APP_DIR}/build/app/outputs/flutter-apk/app-release.apk"
FALLBACK_APK="${APP_DIR}/build/kbi-technician.apk"

if [[ ! -f "${APK_PATH}" && -f "${FALLBACK_APK}" ]]; then
  mkdir -p "$(dirname "${APK_PATH}")"
  cp "${FALLBACK_APK}" "${APK_PATH}"
fi

echo "2️⃣  Locating Release APK..."
if [[ ! -f "${APK_PATH}" ]]; then
  echo "   Building Release APK via Flutter..."
  cd "${APP_DIR}"
  flutter clean
  flutter build apk --release
  cd "${ROOT_DIR}"
fi

if [[ ! -f "${APK_PATH}" ]]; then
  echo "❌ Error: Release APK not found at: ${APK_PATH}"
  exit 1
fi

APK_SIZE=$(du -h "${APK_PATH}" | cut -f1)
echo "   ✓ Release APK found (${APK_SIZE}): ${APK_PATH}"

# Step 3: Prepare Release Notes
EXTRA_FLAGS=()
if [[ -f "${RELEASE_NOTES_FILE}" ]]; then
  echo "3️⃣  Attaching release notes from: ${RELEASE_NOTES_FILE}"
  EXTRA_FLAGS+=(--release-notes-file "${RELEASE_NOTES_FILE}")
else
  EXTRA_FLAGS+=(--release-notes "KBI Technician Mobile App Release")
fi

# Step 4: Tester / Group flags
if [[ -f "${TESTERS_FILE}" ]]; then
  echo "4️⃣  Distributing to testers listed in: ${TESTERS_FILE}"
  EXTRA_FLAGS+=(--testers-file "${TESTERS_FILE}")
elif [[ -n "${TESTER_GROUP}" ]]; then
  echo "4️⃣  Distributing to tester group: ${TESTER_GROUP}"
  EXTRA_FLAGS+=(--groups "${TESTER_GROUP}")
fi

# Step 5: Upload & Distribute
echo "5️⃣  Uploading APK to Firebase App Distribution..."
if ! npx -y firebase-tools@latest appdistribution:distribute "${APK_PATH}" \
  --app "${FIREBASE_APP_ID}" \
  --project "${FIREBASE_PROJECT_ID}" \
  "${EXTRA_FLAGS[@]}"; then
  echo "⚠️  Note: If distributing to groups failed, create the group '${TESTER_GROUP}' in Firebase Console under App Distribution > Testers & Groups, or use a testers file with emails: scripts/testers.txt"
fi

echo "========================================================"
echo "✅ Release successfully uploaded to Firebase App Distribution!"
echo "   Firebase Console: https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/appdistribution"
echo "========================================================"
