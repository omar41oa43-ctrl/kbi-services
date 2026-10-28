# KBI Technician TestFlight release 1.4.5 (13)

Updated 28 October 2026 (Asia/Dubai).

## Package and account

- Bundle: `ae.kbi.kbiTechnicianApp`; Apple team: `PQUS4YTNNP`.
- App Store Connect record: `6827450526` (KBI Technician).
- Version 1.4.5, build 13, built with Xcode 27.1 (`27A9275`), iPhoneOS 27.1 SDK.
- App Store Connect automatic signing/export succeeded using the authorized API key. Existing certificates were not revoked.
- App Store IPA: `/tmp/kbi-testflight-build13-export/KBI Technician.ipa`.
- SHA-256: `c4021bc9aa55adbca291408dfba661c00f07c7e166a92e62033232d1512c122e`.
- Apple accepted the package upload on 28 October 2026. Processing and beta distribution are checked separately; upload acceptance is not beta-review approval.

## Configuration completed

- Account Holder confirmed acceptance of the updated Apple Developer agreement.
- Created App Store Connect app record, English beta description and feedback/privacy contact details.
- Added `ITSAppUsesNonExemptEncryption=false` after checking use of standard transport/OS encryption.
- Configured API-key TestFlight upload lane using environment variables and an external private-key path.
- Created internal and external beta groups. No unspecified testers were invited.
- Created an approved, technician-only review account and verified email/password login plus access to the live parts endpoint. Credentials are stored outside the repository and supplied only to Apple review metadata.
- Added two clearly labeled synthetic review jobs (Assigned and Completed), assigned solely to the review account. No real customer data is included.

## Validation

- Flutter analysis: no issues.
- Flutter unit/widget tests: 95 passed.
- Simulator order lifecycle integration test: passed (accept, travel, arrival, work, completion and rating/invoice checks).
- Live API checks: technician creation and password login, order assignment, status, parts, invoice save and signed rating link passed.
- Temporary integration-test users/orders were cleaned up.
- Location integration test did not complete and was stopped after the session interruption. GPS/background location and APNs delivery still require real-device acceptance checks.

## Firebase Storage blocker

The expected bucket `kbi2-f4f19.firebasestorage.app` remains unavailable. The project-owner CLI login was refreshed and confirmed to have Firebase default-bucket creation permission. Storage creation still returned HTTP 403. The Cloud Billing API reports `billingEnabled: false` for this project, including after the user reported billing was active. The linked billing account must actually be active before provisioning can finish. Storage rules deployment and an authenticated owner-scoped photo/PDF upload must be verified afterward. No billing account was linked and no payment commitment was made by the agent.

## Distribution distinction

The existing Android 1.4.5 (12) release and registered-device development IPA remain separate artifacts. This build 13 App Store package is intended for TestFlight. A public TestFlight link requires the processed build and applicable Beta App Review approval; the App Store production submission is a separate action.
