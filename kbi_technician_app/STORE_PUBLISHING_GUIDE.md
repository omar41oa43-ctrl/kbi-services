# KBI Technician — Store Publishing Guide

## Current readiness

- iOS release build succeeds with bundle ID `ae.kbi.kbiTechnicianApp` and version `1.4.4 (11)`.
- The release build is installed on the USB iPhone and passes a force-close/relaunch test.
- Android is configured for package `ae.kbi.kbi_technician_app`, version `1.4.4 (11)`, target API 36, and production signing.
- A signed Android App Bundle and APK were built and verified successfully by GitHub Actions run `34218988090`. The pipeline runs analysis, the full test suite, package checks, signature verification, and checksums before publishing artifacts.
- Firebase Android and iOS apps are registered in project `kbi2-f4f19`; both package IDs match.
- The Firebase iOS configuration is included in the Runner target.
- Firestore rules compile and are deployed. Account deletion is available inside Profile and requires password confirmation.
- Privacy and Terms pages respond successfully at `https://kbi.services/privacy` and `https://kbi.services/terms`.
- Apple 6.9-inch screenshots are in `screenshots/app-store/upload`.
- Google Play phone screenshots are in `screenshots/play-store/upload`.

## Do not submit until these items are completed

1. Enable billing for Firebase project `kbi2-f4f19`, open Firebase Storage, click **Get started**, choose the production region, then deploy `storage.rules`. Document and profile uploads currently cannot work because the Storage bucket is not provisioned.
2. In Firebase Cloud Messaging, upload an Apple Push Notification authentication key for the Apple team and confirm Push Notifications plus Background Modes / Remote notifications are enabled for the App ID.
3. Build the final archive with a public release of Xcode 26 or later. The current host uses a prerelease Xcode 27 build, so use it for testing only.
4. Provide a permanently available, fully approved technician review account. It must bypass approval/subscription waiting screens and contain at least one demo active job, one completed job, and one shareable invoice.
5. Test account deletion, registration document upload, notification delivery, background location, job completion, and invoice sharing against production before upload.
6. Restore System Integrity Protection on the build Mac before relying on it for local Android builds. Java currently crashes because SIP is disabled; signed Android releases are therefore generated and verified by GitHub Actions.

## Apple App Store Connect recommendations

### Listing

- Name: `KBI Technician`
- Subtitle: `Field Service & Job Hub`
- Primary category: `Business`
- Secondary category: `Productivity`
- Privacy Policy URL: `https://kbi.services/privacy`
- Support URL: `https://kbi.services`
- Marketing URL: `https://kbi.services`
- Keywords: `technician,field service,repair,jobs,dispatch,invoice,work order,maintenance`

### Promotional text

Manage assigned service jobs, live status, job closeout, payments, and professional invoices from one technician workspace.

### Description

KBI Technician gives approved KBI field technicians one secure place to manage their working day.

Use the app to:

- View active, upcoming, and completed service jobs
- Update availability and job progress
- Navigate to assigned service areas
- Record diagnostics, parts, notes, and service photos
- Complete digital customer sign-off
- Create and share professional invoices
- Review earnings, payments, and notifications

Location is used while a technician is on duty or handling an active service to provide routing, live ETA, and job-progress updates. Technicians can stop location sharing by going offline.

An approved KBI technician account is required.

### App Review notes template

KBI Technician is a workforce app for approved KBI field technicians. Please use the review account below; it is already approved and has demo data.

- Email: `REPLACE_WITH_REVIEW_EMAIL`
- Password: `REPLACE_WITH_REVIEW_PASSWORD`
- Demo path: Sign in → Orders → open `ORD-DEMO-014` → Closeout → Official Invoice → Share.
- Account deletion: Profile → Settings → Delete Account Permanently. Enter the review-account password to confirm.
- Background location: used only while the technician is online/on duty or handling an active service. Going Offline stops tracking. The app displays a prominent disclosure before the system permission dialog.
- Contact: `support@kbi.services`, `+971 50 249 1034`

### App Privacy answers to verify in App Store Connect

Declare every type actually collected by the app and Firebase, including:

- Contact info: name, email address, phone number
- Identifiers: user ID and device/push token
- Location: precise location for live ETA and job routing
- User content: photos, uploaded documents, notes, and signatures
- Purchases/financial-related operational data: payment method, invoice and payout records (if linked to the user)
- Diagnostics and app interaction data if enabled by any production analytics/crash SDK

Mark data as linked to the technician where it is stored under their Firebase user ID. Do not declare tracking unless data is used to track users across other companies' apps or websites.

Also complete the updated age-rating questionnaire, content rights, export-compliance questions, Digital Services Act trader status, price/availability, copyright, and app-review contact details.

## Google Play recommendations

### Listing

- App name: `KBI Technician`
- Category: `Business`
- Short description: `Manage KBI service jobs, live status, closeout, payments, and invoices.`

### Full description

KBI Technician is the field-service workspace for approved KBI technicians. View assigned work, manage availability, follow job details, record diagnostics and parts, collect digital sign-off, create and share invoices, and review payments and notifications from one app.

Location helps provide routing and live ETA while a technician is on duty or completing an active service. Going Offline stops location sharing.

An approved KBI technician account is required.

### Play Console declarations

- Complete Data safety using the same real data flows listed in the Apple section.
- Complete the Background Location declaration. Upload a short video showing: the in-app disclosure, permission request, technician going online, active-job ETA/location use, and going offline to stop sharing.
- Use this exact prominent disclosure in the app and declaration: `KBI Technician collects your location to share live ETA and job progress with KBI dispatch and customers while you are on duty or handling an active service, including when the app is in the background. You can stop sharing by going offline.`
- Provide the privacy-policy URL, app-access review credentials, content rating, target-audience answers, ads declaration, government-app declaration, financial-features declaration, and account-deletion URL/details where requested.
- Upload the CI-generated signed AAB to Internal testing before Production. Keep the workflow verification reports with the release record.

## Recommended rollout

1. Enable Firebase Storage and complete the production end-to-end tests.
2. Upload iOS to TestFlight and Android to Play Internal testing.
3. Invite at least two technicians and test for 48 hours, especially background location and invoice sharing.
4. Fix all TestFlight/Pre-launch report crashes and accessibility warnings.
5. Submit to Apple first with detailed review notes, then submit the same verified build behavior to Google Play.
6. Start with a staged rollout (for example 10%, then 25%, then 100%) and monitor authentication, Firestore permission failures, notifications, and job completion.
