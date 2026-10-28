# KBI Technician 1.4.7 (15)

Prepared 28 October 2026, Asia/Dubai.

## Design and reliability improvements

- Calmer shared surfaces, neutral borders, and reduced decorative glow retain the KBI turquoise brand.
- Orders, Inbox, and Profile use consistent page headings. Main content has a comfortable maximum reading width on tablets and desktop previews.
- Dashboard metrics adapt to narrow screens and larger text, keeping full labels and amounts with two decimal places readable.
- Bank cards keep sensible proportions on larger screens.
- Dashboard, Wallet, and Profile show consistent bilingual connection errors with working retry actions. Dashboard waits for data instead of presenting empty results as live figures.
- Removed invented technician names and employee IDs from dashboard fallbacks.
- Navigation has one accessible label per destination, including unread counts.
- The login option explicitly remembers the email address; credentials are still required for each new session.
- Wallet labels distinguish platform fees from technician earnings. Transaction filters wrap, balances can wrap, and the payout action uses a shorter label for enlarged text.
- Navigation accepts legacy numeric-string coordinates and rejects missing, nonfinite, and out-of-range coordinates.
- Repaired the Apple review account's password to match the existing App Store Connect review credentials; successful password login verified. No credentials are stored in this report.

## Validation

- Final Flutter analysis: no issues. Final unit/widget suite: 111 passed.
- Native iPhone 17 Pro navigation test: all five tabs passed in English and Arabic with 1.4× text. This check caught Wallet and long-name Profile overflows that were fixed before release. Disposable account removed.
- Native iPhone StorageService test: PNG/PDF upload, progress, exact download, deletion, and link revocation passed. Disposable account and files removed.
- Widget coverage includes 320/390/768 widths, Arabic, 2× text, exact earnings display, wallet navigation, short-screen error recovery, bank-card widths, and legacy/invalid coordinates.
- Live browser review covered Home, Orders, Wallet, Inbox, Profile and Arabic layout using synthetic review data.
- Screenshots: `artifacts/design-review-1.4.7/`.

## Release status

- App source commit/tag: `9de06c32999596ee225ac43799ec00da6e173c40`, `v1.4.7`.
- Signed Android workflow `40655766939` and app checks `40655749730` passed. App checks include iOS release compilation and backend functions/access-rule tests.
- Android APK/AAB published at https://github.com/omar41oa43-ctrl/kbi-services/releases/tag/v1.4.7. Version, build number, signing-certificate continuity, and GitHub asset SHA-256 digests verified.
- Apple processed build `ce6a46c0-4619-437a-b544-24eb8d291c51` as VALID. App Store signing profile has production push entitlement, beta reporting enabled, and no development-device restrictions.
- Build 15 is attached to internal and public external groups. Internal: READY_FOR_BETA_TESTING. External: WAITING_FOR_BETA_REVIEW; submission WAITING_FOR_REVIEW at 28 October 12:35 Dubai.
- Public link remains https://testflight.apple.com/join/sXF3fgFh, enabled with a 100-tester limit. No email invitations sent; automatic tester notifications disabled for build 15. Build 14 remains available to the group while its own review is pending.
- Production download updated to 1.4.7 (15): deployment `dpl_3kGwG2yVKSc9GtjhycdFfP6NrJsh`. All 27 live browser checks passed across Chromium, Firefox, and WebKit.
- Full checksums and statuses: `artifacts/releases/1.4.7/receipt.json`.

## Remaining device acceptance checks

Background GPS and APNs push delivery require a physical device. Simulator and widget tests do not establish those capabilities. External TestFlight installation remains subject to Apple's beta review.
