# Credentials Registry

> **No secrets in this file.** This document maps credentials to their purpose, scope, restrictions, and where to configure them. Actual secret values live in EAS, Google Cloud Console, Firebase, and Apple Developer Portal.

**Status legend:**

| Symbol | Meaning                 |
| ------ | ----------------------- |
| ✓      | Configured / have       |
| ⚠      | Missing — action needed |
| ○      | Optional or N/A         |

**When to use:** Setting up new environments, debugging auth/maps/push, rotating keys, or onboarding.

---

## 1. EAS Environment Variables (Frontend)

**Manage:** [expo.dev](https://expo.dev) → Your project → **Settings** → **Environment variables**

**Or via CLI:** `eas env:list <environment>`, `eas env:create <environment> --name X --value Y`

**Important:** Variables prefixed with `EXPO_PUBLIC_` are embedded in the compiled app and are never secret. Use `--visibility plaintext` or `--visibility sensitive` for them — never `secret`. See [Expo docs](https://docs.expo.dev/eas/environment-variables/).

### 1.1 Quick Reference

| EAS Env Variable                       | Purpose                                  | dev | preview | prod |
| -------------------------------------- | ---------------------------------------- | :-: | :-----: | :--: |
| `EXPO_PUBLIC_API_URL`                  | Backend API base URL                     |  ○  |    ○    |  ✓   |
| `EXPO_PUBLIC_API_VERSION`              | API version (default: v1)                |  ○  |    ○    |  ○   |
| `EXPO_PUBLIC_SUPABASE_URL`             | Supabase project URL                     | ○\* |    ⚠    |  ✓   |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`        | Supabase anon key                        | ○\* |    ⚠    |  ✓   |
| `EXPO_PUBLIC_GOOGLE_API_KEY_IOS`       | Maps/Places native iOS                   |  ✓  |    ⚠    |  ✓   |
| `EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID`   | Maps/Places native Android               |  ✓  |    ✓    |  ✓   |
| `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`    | Places HTTP fetch (PlacesAutocomplete)   |  ⚠  |    ⚠    |  ✓   |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`     | Google Sign-In (web)                     |  ✓  |    ⚠    |  ✓   |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`     | Google Sign-In (iOS)                     |  ✓  |    ⚠    |  ✓   |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google Sign-In (Android)                 |  ✓  |    ⚠    |  ✓   |
| `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`    | iOS URL scheme for Google Sign-In        |  ○  |    ○    |  ○   |
| `GOOGLE_SERVICES_JSON`                 | Path to google-services.json (alt)       |  ✓  |    ○    |  ✓   |
| `GOOGLE_SERVICES_JSON_BASE64`          | google-services.json as base64           |  ✓  |    ✓    |  ✓   |
| `GOOGLE_SERVICES_JSON_BASE64_PROD`     | google-services_prod.json (prod Android) |  ○  |    ○    |  ✓   |

\* Supabase URL is hardcoded in `app.config.js`; anon key may come from local `.env` for dev.

**Note:** EAS has `GOOGLE_PLACES_API_KEY` but code expects `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` — rename or add with correct prefix.

### 1.2 Setup Instructions for Missing EAS Variables

#### EXPO_PUBLIC_SUPABASE_URL

- **Where to get:** [Supabase Dashboard](https://supabase.com/dashboard) → Your project → **Settings** → **API** → Project URL
- **Value format:** `https://<project-ref>.supabase.co`
- **Production value:** `https://kijatqtrwdzltelqzadx.supabase.co` ✓ (single project for dev + prod)

#### EXPO_PUBLIC_SUPABASE_ANON_KEY

- **Where to get:** Supabase Dashboard → **Settings** → **API** → Project API keys → `anon` `public`
- **Set in EAS:** Use `--visibility plaintext` or `--visibility sensitive` (never `secret` — EXPO*PUBLIC*\* vars are client-visible)
  ```bash
  eas env:create production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<your-anon-key>" --visibility sensitive
  ```

#### EXPO_PUBLIC_API_URL

- **Value:** `https://api.nomadcrew.uk` (or your backend URL)
- **Note:** Code has fallback; optional but recommended for explicitness.

#### EXPO_PUBLIC_GOOGLE_PLACES_API_KEY

- **Where to get:** See [§2.2 Places API Key (HTTP Fetch)](#22-places-api-key-http-fetch)
- **Fix for wrong name:** EAS has `GOOGLE_PLACES_API_KEY` — create `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` with same value. Use `--visibility plaintext` or `--visibility sensitive` (never `secret`).

#### GOOGLE_SERVICES_JSON_BASE64_PROD

- **Where to get:** Firebase Console → Project Settings → Your apps → Android (prod) → Download `google-services.json`
- **Encode:** `base64 -w 0 google-services.json` (Linux) or `[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-services.json"))` (PowerShell)
- **Set in EAS:** `eas env:create production --name GOOGLE_SERVICES_JSON_BASE64_PROD --value "<base64>" --visibility secret`
- **Note:** `setup-google-services.js` currently only handles dev; needs update to support prod variant.

---

## 2. Google Cloud Console

**Manage:** [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)

**Project:** Select project `nomadcrew-11fd4` (or your Firebase-linked GCP project)

### 2.1 API Keys Overview

| Key Purpose           | Env Variable                                    | Restriction Type | APIs to Enable                                                   | Status   |
| --------------------- | ----------------------------------------------- | ---------------- | ---------------------------------------------------------------- | -------- |
| Places HTTP fetch     | `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`             | None (or IP)     | Places API, Places API (New), Maps JavaScript API                | ⚠ Verify |
| Android native (dev)  | `EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID` (dev env)  | Android apps     | Maps SDK Android, Geocoding, Places, FCM, Firebase Installations | ✓        |
| Android native (prod) | `EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID` (prod env) | Android apps     | Same                                                             | ✓        |
| iOS native (dev)      | `EXPO_PUBLIC_GOOGLE_API_KEY_IOS` (dev env)      | iOS apps         | Maps SDK iOS, Geocoding, Places, FCM, etc.                       | ✓        |
| iOS native (prod)     | `EXPO_PUBLIC_GOOGLE_API_KEY_IOS` (prod env)     | iOS apps         | Same                                                             | ✓        |

### 2.2 Places API Key (HTTP Fetch)

**Used by:** `PlacesAutocomplete.tsx` — HTTP calls, not native SDK.

**Where to create:**

1. GCP → **APIs & Services** → **Credentials**
2. **Create credentials** → **API key**
3. Edit key:
   - **Application restrictions:** None (or "IP addresses" if you restrict)
   - **API restrictions:** Restrict to: Places API, Places API (New), Maps JavaScript API

**Critical:** Do not use Android/iOS app–restricted keys for this — HTTP fetch will fail with `REQUEST_DENIED`.

### 2.3 Native SDK Keys (Maps, Places, Firebase)

**Where to create:** GCP → **APIs & Services** → **Credentials** → **Create credentials** → **API key**

**For Android key:**

- **Application restrictions:** Android apps
- Add: **Package name** `com.nomadcrew.app.dev` (dev) or `com.nomadcrew.app` (prod)
- Add: **SHA-1** from `eas credentials --platform android` (Keystore section)
- **API restrictions:** Maps SDK for Android, Geocoding API, Places API, Places API (New), Firebase Cloud Messaging API, Firebase Installations API, FCM Registration API

**For iOS key:**

- **Application restrictions:** iOS apps
- Add: **Bundle ID** `com.nomadcrew.app.dev` (dev) or `com.nomadcrew.app` (prod)
- **API restrictions:** Maps SDK for iOS, Geocoding API, Places API, Places API (New), Firebase APIs

**Get SHA-1 for EAS builds:**

```bash
eas credentials --platform android
# Dev: Keystore → SHA-1
# Prod: Upload keystore → SHA-1
```

### 2.4 OAuth 2.0 Client IDs (Google Sign-In)

**Where to create:** GCP → **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**

| Client Type     | Env Variable                           | Where to configure                                                                      | Status |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| Web application | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`     | OAuth consent screen → Create OAuth client ID → Web application                         | ✓      |
| iOS             | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`     | Create OAuth client ID → iOS → Bundle ID `com.nomadcrew.app` or `com.nomadcrew.app.dev` | ✓      |
| Android         | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Create OAuth client ID → Android → Package name + SHA-1                                 | ✓      |

**Android OAuth:** Add both dev and prod SHA-1 fingerprints to the same client (or create separate clients per env).

**iOS URL scheme:** `com.googleusercontent.apps.<CLIENT_ID_NUMBER>` — e.g. from client `369652278516-xxx.apps.googleusercontent.com` → `com.googleusercontent.apps.369652278516-xxx`. This goes in `app.config.js` `CFBundleURLSchemes` and `@react-native-google-signin/google-signin` config.

---

## 3. Firebase

**Manage:** [Firebase Console](https://console.firebase.google.com/)

**Project:** nomadcrew-11fd4 (or your project)

### 3.1 Firebase Apps Checklist

| App            | Platform | Package / Bundle ID     | Config File                     | Status |
| -------------- | -------- | ----------------------- | ------------------------------- | ------ |
| NomadCrew Dev  | Android  | `com.nomadcrew.app.dev` | `google-services_dev.json`      | ✓      |
| NomadCrew Prod | Android  | `com.nomadcrew.app`     | `google-services_prod.json`     | ⚠      |
| NomadCrew Dev  | iOS      | `com.nomadcrew.app.dev` | `GoogleService-Info_dev.plist`  | ○      |
| NomadCrew Prod | iOS      | `com.nomadcrew.app`     | `GoogleService-Info_prod.plist` | ○      |

**Add Android app (prod) if missing:**

1. Firebase Console → Project Overview → **Add app** → Android
2. Package name: `com.nomadcrew.app`
3. Register app → Download `google-services.json` → Save as `google-services_prod.json`
4. Base64 encode and add to EAS as `GOOGLE_SERVICES_JSON_BASE64_PROD`

**Add iOS app (if using Firebase on iOS):**

1. Add app → iOS → Bundle ID `com.nomadcrew.app` or `com.nomadcrew.app.dev`
2. Download `GoogleService-Info.plist`
3. Add to Xcode project or use EAS/Expo config if supported

### 3.2 Push Notifications (FCM)

- FCM uses the same Firebase project; configured via `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).
- No separate API key for FCM in the app — it comes from the config files.
- **Expo Push:** Uses EAS project ID (`50d59d51-34e0-49ab-a7ee-6989ed09f8ef`); no extra Firebase config needed for Expo Push.

---

## 4. Apple Developer Portal

**Manage:** [Apple Developer](https://developer.apple.com/account/)

**Team ID:** `27DC66D35A`

### 4.1 App IDs

| App ID      | Identifier              | Capabilities                                               | Status |
| ----------- | ----------------------- | ---------------------------------------------------------- | ------ |
| Production  | `com.nomadcrew.app`     | Sign in with Apple, Push Notifications, Associated Domains | ✓      |
| Development | `com.nomadcrew.app.dev` | Same                                                       | ✓      |

**Create App ID if missing:**

1. **Certificates, Identifiers & Profiles** → **Identifiers** → **+**
2. **App IDs** → **App** → Continue
3. Description: "NomadCrew"
4. Bundle ID: Explicit → `com.nomadcrew.app` or `com.nomadcrew.app.dev`
5. Capabilities: Enable **Sign in with Apple**, **Push Notifications**, **Associated Domains**
6. Register

### 4.2 Sign in with Apple Service IDs

| Service ID                     | Purpose             | Status |
| ------------------------------ | ------------------- | ------ |
| `com.nomadcrew.app.signin`     | Production web/auth | ✓      |
| `com.nomadcrew.app.dev.signin` | Development         | ✓      |

**Create Service ID if missing:**

1. **Identifiers** → **+** → **Services IDs**
2. Description: "NomadCrew Sign In"
3. Identifier: `com.nomadcrew.app.signin`
4. Enable **Sign in with Apple** → Configure: Domains (e.g. `nomadcrew.uk`), Return URLs
5. Save

### 4.3 Associated Domains

- **Domain:** `applinks:nomadcrew.uk`
- **Where to set:** App ID → Edit → Associated Domains → Add `applinks:nomadcrew.uk`
- **Server:** Must host `apple-app-site-association` at `https://nomadcrew.uk/.well-known/apple-app-site-association`

### 4.4 APNs Keys (Push Notifications)

- **Where:** Certificates, Identifiers & Profiles → **Keys** → **+**
- **Key name:** e.g. "NomadCrew Push"
- **Enable:** Apple Push Notifications service (APNs)
- **Continue** → Register → Download `.p8` (one-time; store securely)
- **Key ID** and **Team ID** used by EAS/Expo for push. EAS typically manages this via `eas credentials`.

### 4.5 App Store Connect / EAS Submit

| Field         | Value                 | Where to set                                                                         |
| ------------- | --------------------- | ------------------------------------------------------------------------------------ |
| Apple ID      | (your Apple ID email) | `eas.json` → submit.production.ios.appleId                                           |
| ASC App ID    | `6743161123`          | [App Store Connect](https://appstoreconnect.apple.com/) → Your app → App Information |
| Apple Team ID | `27DC66D35A`          | `eas.json` → submit.production.ios.appleTeamId                                       |

**Get ASC App ID:** App Store Connect → Apps → NomadCrew → App Information → Apple ID (numeric).

---

## 5. Google Play Console (Android Submit)

**Manage:** [Google Play Console](https://play.google.com/console)

### 5.1 Service Account for EAS Submit

**Status:** ⚠ Configured path in `eas.json`; file may be missing.

**Path in eas.json:** `./SECRET/nomadcrew-11fd4-531f63803e8b.json` ✓

**How to create:**

1. Google Play Console → **Setup** → **API access**
2. Link project or create new service account
3. **Create new service account** → Opens GCP
4. GCP → IAM & Admin → Service Accounts → Create
5. Grant role (e.g. "Service Account User")
6. Create key → JSON → Download
7. Save as `play-service-account.json` (or path you use)
8. **Permissions in Play Console:** Service accounts → Manage Play Console permissions → Add app (NomadCrew) → Admin (or appropriate role)
9. Update `eas.json`:
   ```json
   "android": {
     "serviceAccountKeyPath": "./play-service-account.json",
     "track": "production"
   }
   ```
10. Add `play-service-account.json` to `.gitignore` — never commit.

---

## 6. App Identifiers (Device Config)

Use these when configuring GCP, Firebase, or Apple.

### 6.1 Android

| Build       | Package Name            | SHA-1 Source                                                 |
| ----------- | ----------------------- | ------------------------------------------------------------ |
| Development | `com.nomadcrew.app.dev` | `eas credentials --platform android` → Keystore SHA-1        |
| Production  | `com.nomadcrew.app`     | `eas credentials --platform android` → Upload keystore SHA-1 |

### 6.2 iOS

| Build       | Bundle Identifier       |
| ----------- | ----------------------- |
| Development | `com.nomadcrew.app.dev` |
| Production  | `com.nomadcrew.app`     |

### 6.3 URL Schemes

| Scheme                                   | Purpose                       |
| ---------------------------------------- | ----------------------------- |
| `nomadcrew`                              | App deep links, auth callback |
| `com.googleusercontent.apps.<CLIENT_ID>` | Google Sign-In callback       |

---

## 7. Backend (nomad-crew-backend)

**Storage:** `.env` or deployment platform secrets (not EAS)

| Variable                                                  | Purpose                      | Where to get                                                 | Status         |
| --------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ | -------------- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL                   | Neon, Supabase, or self-hosted                               | ⚠              |
| `DB_CONNECTION_STRING`                                    | Full connection string       | Same as above                                                | ⚠              |
| `REDIS_ADDRESS`, `REDIS_PASSWORD`, `REDIS_DB`             | Redis                        | Upstash, Redis Cloud, or self-hosted                         | ⚠              |
| `JWT_SECRET_KEY`                                          | Auth token signing           | Generate: `openssl rand -base64 32`                          | ⚠              |
| `SUPABASE_URL`                                            | Supabase project URL         | Supabase Dashboard → Settings → API                          | ✓ (in example) |
| `SUPABASE_ANON_KEY`                                       | Supabase anon key            | Supabase Dashboard → Settings → API                          | ⚠              |
| `SUPABASE_SERVICE_KEY`                                    | Supabase service role        | Supabase Dashboard → Settings → API                          | ⚠              |
| `SUPABASE_JWT_SECRET`                                     | JWT verification             | Supabase Dashboard → Settings → API → JWT Secret             | ⚠              |
| `GEOAPIFY_KEY`                                            | Geo APIs                     | [Geoapify](https://www.geoapify.com/) → Dashboard → API Keys | ⚠              |
| `PEXELS_API_KEY`                                          | Media / images               | [Pexels API](https://www.pexels.com/api/)                    | ⚠              |
| `RESEND_API_KEY`                                          | Transactional email          | [Resend](https://resend.com/) → API Keys                     | ⚠              |
| `EMAIL_FROM_ADDRESS`                                      | Sender email                 | Your verified domain                                         | ⚠              |
| `EMAIL_FROM_NAME`                                         | Sender name                  | e.g. "NomadCrew"                                             | ⚠              |
| `SERVER_ENVIRONMENT`                                      | `development` / `production` | —                                                            | ⚠              |
| `ALLOWED_ORIGINS`                                         | CORS origins                 | e.g. `https://nomadcrew.uk`                                  | ⚠              |
| `FRONTEND_URL`                                            | Frontend base URL            | e.g. `https://nomadcrew.uk`                                  | ⚠              |
| `AWS_REGION`, `AWS_SECRETS_PATH`                          | AWS (if used)                | AWS Console                                                  | ○              |

---

## 8. Common Tasks

### Add missing EAS variable

```bash
eas env:create production --name EXPO_PUBLIC_FOO --value "..." --visibility plaintext
# EXPO_PUBLIC_* vars: use plaintext or sensitive only (never secret)
# Non-EXPO_PUBLIC vars (e.g. GOOGLE_SERVICES_JSON_BASE64): use secret
# Use --force to overwrite existing
```

### Rename GOOGLE_PLACES_API_KEY → EXPO_PUBLIC_GOOGLE_PLACES_API_KEY

```bash
# Create new with correct name (copy value from EAS dashboard or GOOGLE_PLACES_API_KEY)
eas env:create production --name EXPO_PUBLIC_GOOGLE_PLACES_API_KEY --value "<value>" --visibility sensitive
# Optionally delete old: eas env:delete production --name GOOGLE_PLACES_API_KEY
```

### Add prod SHA-1 to Google OAuth

1. `eas credentials --platform android` → copy Upload keystore SHA-1
2. GCP → Credentials → OAuth 2.0 Client IDs → Android client → Add fingerprint → Paste SHA-1

### Rotate Google API key

1. GCP → Credentials → Create new API key with same restrictions
2. `eas env:create production --name EXPO_PUBLIC_GOOGLE_... --value "<new-key>" --force`
3. Delete old key in GCP

### Update google-services.json for prod

1. Firebase → Project Settings → Your apps → Android (prod) → Download `google-services.json`
2. Base64 encode → Create EAS secret `GOOGLE_SERVICES_JSON_BASE64_PROD`
3. Update `scripts/setup-google-services.js` to handle prod (check `APP_VARIANT` and use prod secret when `production`)

---

## 9. Related Docs

- [EAS_SECRETS_GUIDE.md](./EAS_SECRETS_GUIDE.md) — EAS env vars, auto-load, common mistakes
- [GOOGLE_API_KEYS.md](./GOOGLE_API_KEYS.md) — HTTP fetch vs native SDK
- [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) — FCM, APNs, Expo Push
- [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) — Local env setup

---

_Last updated: 2026-02-11. Update this file when adding or changing credentials._
