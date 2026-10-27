# KBI Technician 1.4.5 (12)

Updated 27 October 2026.

## Changes

The app uses the same turquoise, dark surfaces, readable secondary text and borders as the KBI download page. Orders, wallet, profile, registration, approval, notifications and dialogs share the palette. Success, warning and error colors keep their distinct meanings. The invoice remains a readable white document inside the dark app shell. The invoice toolbar fits small phones and exposes edit/preview and sharing through its options menu. Native launch screens use KBI branding and the dark background rather than a white placeholder.

The portrait now uses the actual available height, fixing four existing small-phone/landscape regression failures. Authentication dialogs use the app theme instead of switching independently with the operating system.

## Validation

- Flutter analysis: no issues.
- Flutter tests: 95 passed, including English/Arabic layouts, 140% text, contrast ratios, registration validation, authentication navigation, password reset, bank and wallet calculations, service-request parsing and location-tracking logic.
- Backend unit tests: five passed. Cloud CI passed the Firestore rules checks.
- iPhone simulator: the final app compiled, installed and launched.
- Download-page browser checks: 16 passed on Chromium and WebKit at widths 320, 390, 768 and 1440. Final asset links are checked separately after publication.
- Signed iPhone archive and IPA: version 1.4.5, build 12, bundle ae.kbi.kbiTechnicianApp, iOS 15+. Code-signature verification passed.
- Android artifacts are built and signed by GitHub Actions, since this Mac's Java runtime crashes before Gradle starts. The release pipeline completed successfully. Certificate continuity and artifact checksums are checked before publication.

The website staging directory was reconstructed from 458 hash-verified files from the live Vercel deployment. Only app/download/page.tsx and app/download/download.module.css differ from that production snapshot.

## Distribution limits and outstanding service check

The iPhone IPA uses an existing Apple development profile for seven registered devices. It is installed from a Mac with Apple Configurator or Xcode, with Developer Mode enabled. It is not a public Safari installer or a TestFlight/App Store release. Public distribution still requires that Apple publishing setup.

At the start of this release, an authenticated Firebase Admin check confirmed that kbi2-f4f19.firebasestorage.app did not exist. Document and photo uploads therefore cannot be declared working until Storage is provisioned and an actual upload succeeds. The user has said they will enable Storage. Background GPS, push delivery, real payment operations and signed-in production job mutations were not exercised against a physical device in this release; automated checks do not certify these external services.

## Release locations

- App source: last kbi app/
- Release branch: codex/technician-design-v1.4.5
- Android build: https://github.com/omar41oa43-ctrl/kbi-services/actions/runs/40460651331
- Download page: https://kbi.services/download
