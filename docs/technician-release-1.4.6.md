# KBI Technician 1.4.6 (14): Supabase file uploads

Prepared 28 October 2026 (Asia/Dubai).

## Completed storage setup

- Installed Supabase CLI 2.122.0 and signed in using the user-completed browser login.
- Created KBI Services organization and KBI Technician Files hosted project `ydxbojizwxpehzfgqbku` in Mumbai.
- Created the private `technician-files` bucket with a 10 MiB limit and JPEG/PNG/PDF allowlist.
- Applied the SQL migration and deployed `technician-files`, which verifies Firebase JWTs directly. Firebase login, roles, profiles, and job data remain in Firebase.
- Existing Firebase file URLs continue to work. New uploads use Supabase. No existing customer records were copied to Supabase.
- App account deletion removes the account's Supabase files and revokes file links.
- No paid Supabase plan or Google billing account was activated.

## Verified

- Flutter analysis: no issues.
- Flutter unit/widget tests: 98 passed.
- File security tests: 3 passed, including signed Firebase token verification, wrong-project/tampered/expired token rejection, path traversal and file validation, and hashed download tokens.
- Deno function type check: passed locally and in GitHub CI.
- Live API: PNG and PDF upload/confirmation, exact downloaded bytes, anonymous denial, bad download-token denial, unsupported/oversized files, private metadata denial, and owner-file deletion/link revocation passed. Temporary files and test users removed.
- iPhone 17 Pro simulator: actual Flutter StorageService uploaded PNG/PDF, verified downloaded bytes and progress, deleted files, and confirmed their links became unavailable. Test passed; temporary account/files removed.
- Hosted bucket read-back: private=true, maximum 10,485,760 bytes, JPEG/PNG/PDF allowlist.

## Release progress

- Source commit: `be1b23e247d4ac82bb178d4ff04a24b8940c6be9`, tag `v1.4.6`.
- Android release workflow: `40640832388`.
- App checks workflow: `40640832374`.
- Supabase security workflow: `40640832328` passed.
- App Store export/upload succeeded. Apple processed build `28486085-7dc7-48bc-83ac-96e138670c79` as VALID, with encryption declaration accepted.
- Internal testing: READY_FOR_BETA_TESTING. External: WAITING_FOR_BETA_REVIEW. Both groups include build 14; the public group no longer includes the old build 13.
- iOS IPA SHA-256: `223c4fa469f15cfae732bb09f7ae4cd79868ea35cdb5a6bde529305c098e3d1a`.
- Android APK/AAB published at https://github.com/omar41oa43-ctrl/kbi-services/releases/tag/v1.4.6. Certificate continuity and artifact checksums verified.
- App checks, signed Android release and Supabase security CI all passed.
- Production download page deployed as `dpl_B3jqfDFTY8tzqp7H2ntrCxrY8jSJ`; 27 live browser checks passed across Chromium, Firefox and WebKit.
- Public invitation remains https://testflight.apple.com/join/sXF3fgFh. External installation depends on Apple beta approval of the applicable build.

## Limits and remaining acceptance checks

Private bucket files are accessed through random, confidential download-link tokens, preserving the app's prior Firebase download-link behavior. Sharing the full link grants viewing. The app reserves upload capacity atomically, capped at 100 MiB per technician and 900 MiB overall; these are application limits, not account billing caps. Free-plan storage, transfer, and project-inactivity limits still apply. Review production capacity before exceeding the initial testing allowance.

Real-device background GPS and APNs delivery remain separate acceptance checks; the new storage tests do not establish those capabilities.
