# KBI technician file storage

Supabase CLI 2.122.0. Hosted project `ydxbojizwxpehzfgqbku`, organization KBI Services, region Mumbai (`ap-south-1`). This project stores technician files only; Firebase continues to handle sign-in and jobs.

## Security and compatibility

- Private `technician-files` bucket; no anonymous object-reading policies.
- Function checks Google's RS256 signature, Firebase issuer, audience, expiry and subject. Anonymous Firebase accounts are rejected. Existing application role claims are unchanged.
- A signed upload URL permits one unique object path. Uploads allow PNG/JPEG/PDF, at most 10 MiB. The service confirms the stored object's actual size and MIME type before returning success.
- Download links contain a random 256-bit access token. Only its hash is stored. Possession of the link grants viewing, matching the app's previous Firebase download-link behavior. Keep these links confidential. The private object URL behind it expires after 60 seconds; deleting the metadata revokes the persistent link.
- Postgres metadata has RLS enabled, with no `anon` or `authenticated` grants. Only the function's service role can read or write it. No service keys are embedded in Flutter.
- Upload reservations are atomic: 100 MiB per technician, 900 MiB overall, conservatively reserving 10 MiB until upload confirmation. This leaves headroom within the initial free storage allowance. These are application limits, not a billing cap for the Supabase account.
- App account deletion removes the signed-in technician's Supabase objects and access links before deleting their Firebase account.
- Existing Firebase file URLs remain readable. New uploads use Supabase. No existing customer data was migrated.

## Deploy

```sh
supabase login
supabase link --project-ref ydxbojizwxpehzfgqbku
supabase db push --linked
supabase functions deploy technician-files --project-ref ydxbojizwxpehzfgqbku --use-api
```

The function uses the platform-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Firebase project defaults to `kbi2-f4f19`; optionally set `FIREBASE_PROJECT_ID` as a function secret. The gateway's Supabase JWT validation is disabled because the function performs Firebase JWT verification itself.

Flutter configuration: `TECHNICIAN_FILE_SERVICE_URL` defaults to the hosted function URL. The Firebase fallback is retained only for builds explicitly configured with an empty service URL.

## Verify

```sh
node --test tests/technician-file-security.test.mjs
# Authenticated CLI + local Firebase Admin credentials required:
node scripts/run-technician-storage-e2e.mjs
deno check --no-config supabase/functions/technician-files/index.ts
cd 'last kbi app'
flutter analyze
flutter test
```

The native upload test additionally needs `TEST_CUSTOM_TOKEN` for a temporary Firebase test user and a booted iPhone simulator/device. Never commit this token. Live API verification covers image/PDF upload and exact download bytes, anonymous denial, path validation, file limits, wrong download token and private metadata denial. Remove temporary objects/users afterward.

When storage fills, investigate incomplete reservations and expected retention before deleting anything. Higher storage/traffic use requires an explicit plan decision. No paid plan was activated by this setup.
