# KBI Technician: TestFlight readiness

> Update 28 October: photo/document uploads are now verified through private Supabase storage in 1.4.6 (14). See [the current release record](technician-release-1.4.6.md).

> Superseded: Apple agreement, app record, signing and upload setup were resolved. See [build 13 release status](testflight-release-1.4.5-13.md) for current results and remaining Storage/device checks.

Checked 27 October 2026. App version 1.4.5 (12), bundle ae.kbi.kbiTechnicianApp, Apple team PQUS4YTNNP.

## Confirmed upload blockers

1. **Distribution signing is not available locally.** An export of the existing archive using method `app-store-connect`, destination `export`, and automatic signing failed. Xcode reported `No signing certificate "iOS Distribution" found` and `No profiles for 'ae.kbi.kbiTechnicianApp' were found`. No App Store IPA was produced. The keychain contains development identities but no Apple/iOS Distribution identity. An authorized Apple account must provide App Store distribution signing, either local or through supported cloud-managed signing.
2. **The cached App Store Connect session is expired.** A read-only request to Apple's session endpoint returned HTTP 401. No App Store Connect API key was found in the usual local key directories, and no publishing credentials were set in the process environment. Sign in again using Xcode/App Store Connect, or configure an authorized API-key upload flow. This check does not prove that an App Store Connect app record or distribution certificate is absent from the Apple account; the account could not be inspected.

## Current build

- The existing downloadable IPA is signed for development/registered devices. Its export method is `debugging`. It is not the package to upload to TestFlight.
- The archive is version 1.4.5 (12), built with Xcode 27 beta, build 27A5194q, and the iOS 27 SDK.
- A separate Xcode 27.1 installation, build 27A9275, exists at /Applications/Xcode.app. Use the appropriate supported toolchain and validate the final App Store export/upload. Do not treat a beta toolchain alone as a confirmed TestFlight rejection without Apple's validation.
- Apple's current upload documentation requires iOS builds to be built with Xcode 26 or later.
- The app does not declare `ITSAppUsesNonExemptEncryption` in its Info.plist. Complete the export-compliance determination in App Store Connect, or add the appropriate declaration after confirming the app's actual encryption use. No compliance answer was submitted during this audit.

## App readiness before external testing

- **Firebase Storage is still missing.** The configured bucket kbi2-f4f19.firebasestorage.app returned HTTP 404. The prior authenticated Firebase Admin check also reported that it did not exist. Document/photo uploads remain blocked. The user has said they will enable Storage; rules deployment and a real upload still need verification after provisioning.
- **Review login is not supplied in the local publishing material.** The publishing guide still contains placeholders for the review email and password; only review notes exist in the fastlane review-information directory. External review needs a working approved technician account or an appropriate review/demo flow, with demo jobs and invoice access.
- **Device acceptance checks remain.** Verify registration uploads, account deletion, job acceptance/completion, invoice sharing, APNs notification delivery, and on-duty/background location on a real iPhone. Release entitlements already specify production push and Info.plist includes location and remote-notification background modes; these declarations do not prove that Firebase APNs credentials or actual delivery work.
- **TestFlight metadata needs account verification.** Confirm beta description, What to Test, feedback email, beta-review contact and sign-in information, encryption answers, tester groups, and the processed build's status in App Store Connect. Account membership, app-record existence and pending agreements remain unverified because the session is expired.

## Internal versus external testing

For internal testing, upload and process an App Store Connect build, resolve its compliance/status issues, then add it to an internal group of eligible App Store Connect users. For external testers/public links, provide the beta review information and obtain the required Beta App Review approval. A complete App Store marketing release is a separate milestone.

## Checks already passed

- Flutter static analysis: no issues.
- Flutter tests: 95 passed.
- Cloud iOS compile, Android checks, backend and Firestore rules checks: passed.
- Download page: 27 live browser checks passed.
- Development IPA signature and version: verified.
- Updated app installed and launched in the iPhone simulator.

These checks do not substitute for signing/upload validation or real-device testing of production services.

## Apple references

- Upload builds: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds
- TestFlight overview: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
- Internal testers: https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers
- Provide test information: https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information/
- Export compliance: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance
