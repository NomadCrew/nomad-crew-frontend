# Google API Keys & OAuth Clients

> **Last Updated:** 2026-02-02
> **Project:** nomadcrew-11fd4 (Firebase project ID: 369652278516)

## Overview

NomadCrew uses multiple Google API keys for different purposes. Understanding when to use each key is critical to avoid `REQUEST_DENIED` errors.

## Key Concepts

### Application Restrictions vs API Restrictions

| Restriction Type | Purpose | Use Case |
|------------------|---------|----------|
| **None** | No restrictions | Development/testing only |
| **Android apps** | Native SDK calls only | Maps SDK, native Firebase |
| **iOS apps** | Native SDK calls only | Maps SDK, native Firebase |
| **HTTP referrers** | Web browser requests | Web apps with domain restriction |
| **IP addresses** | Server-side calls | Backend API calls |

### Important: HTTP Fetch vs Native SDK

- **Native SDK** (Maps, Firebase): Use keys with **Android/iOS app restrictions**
- **HTTP Fetch** (Places Autocomplete REST API): Use keys with **None** or **IP restrictions**

The `PlacesAutocomplete.tsx` component uses **HTTP fetch**, NOT the native SDK.

---

## API Keys Inventory

### 1. Places API (Unrestricted) - FOR HTTP FETCH
| Property | Value |
|----------|-------|
| **Name** | Places API |
| **Key** | `AIzaSyBrlqQC4GcSRJk4GStOcdw3ZbhcboIFmiA` |
| **Created** | May 19, 2025 |
| **Application Restriction** | None |
| **API Restriction** | Places API, Places API (New), Maps JavaScript API |
| **Use For** | PlacesAutocomplete HTTP fetch calls |

**Env Variable:** `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`

---

### 2. Android-dev - FOR NATIVE SDK
| Property | Value |
|----------|-------|
| **Name** | Android-dev |
| **Key** | `AIzaSyA6CjGek7YCCBS7V-Uuqb6cLoHWtYTnVe4` |
| **Created** | Mar 15, 2025 |
| **Application Restriction** | Android apps |
| **APIs Enabled** | FCM Registration API, Firebase Cloud Messaging API, Firebase Installations API, Geocoding API, Maps SDK for Android, Places API, Places API (New) |
| **Use For** | Native Google Maps SDK, Firebase services on Android |

**Env Variable:** `EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID` (for native SDK only)

---

### 3. ios-dev / nomadcrew-ios - FOR NATIVE SDK
| Property | Value |
|----------|-------|
| **Name** | ios-dev / nomadcrew-ios |
| **Created** | Mar 15, 2025 |
| **Application Restriction** | iOS apps |
| **APIs Enabled** | 25 APIs (Maps, Firebase, etc.) |
| **Use For** | Native Google Maps SDK, Firebase services on iOS |

**Env Variable:** `EXPO_PUBLIC_GOOGLE_API_KEY_IOS` (for native SDK only)

---

### 4. Browser key (Firebase auto-created)
| Property | Value |
|----------|-------|
| **Name** | Browser key (auto created by Firebase) |
| **Created** | Mar 10, 2024 |
| **Application Restriction** | HTTP referrers (likely) |
| **APIs Enabled** | 49 APIs |
| **Use For** | Firebase web SDK, web-based services |

---

### 5. iOS key (Firebase auto-created)
| Property | Value |
|----------|-------|
| **Name** | iOS key (auto created by Firebase) |
| **Created** | Mar 13, 2025 |
| **Application Restriction** | iOS apps |
| **APIs Enabled** | 25 APIs |
| **Use For** | Firebase iOS SDK |

---

## OAuth 2.0 Client IDs

These are for **authentication** (Google Sign-In), NOT for API calls.

| Client | ID | Use |
|--------|-----|-----|
| **Web** | `369652278516-gamn2lkrh2ul45v7l8nn6i9su8nseu7j.apps.googleusercontent.com` | Web Google Sign-In, Supabase OAuth |
| **Android** | `369652278516-017392ava3efskitnvm1guk6ehgvtki2.apps.googleusercontent.com` | Android Google Sign-In |
| **iOS** | `369652278516-05kcrkp3l28g4lt0hhki48othfgug3nc.apps.googleusercontent.com` | iOS Google Sign-In |

### Android OAuth Client SHA-1 Fingerprints

| Build Type | SHA-1 | Source |
|------------|-------|--------|
| EAS Dev Build | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` | Expo keystore |
| EAS Prod Build | (different) | Upload keystore via `eas credentials` |

---

## Environment Variables

### .env.development
```bash
# OAuth Client IDs (for Google Sign-In)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=369652278516-gamn2lkrh2ul45v7l8nn6i9su8nseu7j.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=com.googleusercontent.apps.369652278516-05kcrkp3l28g4lt0hhki48othfgug3nc
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=369652278516-017392ava3efskitnvm1guk6ehgvtki2.apps.googleusercontent.com

# API Keys
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyBrlqQC4GcSRJk4GStOcdw3ZbhcboIFmiA  # Unrestricted, for HTTP fetch
# EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID=...  # Only for native SDK, NOT for HTTP fetch
# EXPO_PUBLIC_GOOGLE_API_KEY_IOS=...      # Only for native SDK, NOT for HTTP fetch
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `REQUEST_DENIED: API key is expired` | Key deleted or disabled | Generate new key |
| `REQUEST_DENIED: not authorized to use this API key` | Wrong restriction type | Use unrestricted key for HTTP fetch |
| `REQUEST_DENIED: IP address not authorized` | IP restriction on key | Remove IP restriction or add your IP |
| `DEVELOPER_ERROR 10` | Wrong SHA-1 for OAuth client | Update OAuth client with EAS SHA-1 |
| `API key is missing` | Env variable not set | Check `.env.development` |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-02 | Use unrestricted key for PlacesAutocomplete | HTTP fetch doesn't work with Android app-restricted keys |
| 2026-02-02 | Comment out `EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID` in dev | Prevents fallback logic from using restricted key |

---

## See Also

- [Development Setup](./DEVELOPMENT_SETUP.md) - Full setup guide
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Manage keys
