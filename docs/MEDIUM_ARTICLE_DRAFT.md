# Expo EAS Build: Google Maps Not Working with react-native-maps? Fix Your API Key Configuration (2025/2026)

*Why your Google Maps API key fails in Expo EAS builds for Android & iOS—and the complete react-native-maps configuration guide.*

> **Keywords:** Expo EAS build, Google Maps not working, react-native-maps, Android, iOS, API key configuration, config plugin, provider google, 2025, 2026

---

## The Problem

You've configured `react-native-maps` with `provider="google"` in your Expo app. It works perfectly in development. But after running `eas build`, Google Maps shows:
- Infinite loading spinner (Android)
- Blank map or "Google Maps cannot load" (iOS)
- Gray tiles with no map data

You've set up your Expo config plugin, added your Google Maps API key, and everything *looks* correct. But it's not working.

**This guide explains why—and how to fix it.**

---

## Part 1: The Post-Mortem (TL;DR for Senior Devs)

### The Problem
Google Maps showed infinite loading spinner in EAS builds. Worked perfectly in local development.

### The Clue
Native logs revealed: `API Key: @EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID`

That's not an API key. That's a literal string.

### What We Had (Wrong)
```json
// eas.json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID": "@EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID"
      }
    }
  }
}
```

### The Misconception
We assumed `@SECRET_NAME` was interpolation syntax. It's not. Neither is `$(SECRET_NAME)`. Both become literal strings.

### The Reality
EAS secrets are **auto-injected** into builds. When you create a secret via `eas secret:create`, it's automatically available as `process.env.SECRET_NAME`. No reference needed.

### The Conflict
When the same variable exists in both EAS secrets AND `eas.json` `env`, the `eas.json` value wins. Our literal `@SECRET_NAME` string overwrote the real secret.

### The Fix
```json
// eas.json - just remove the secret references
{
  "build": {
    "development": {
      "env": {
        "APP_VARIANT": "development"
        // Don't put secrets here - they auto-load
      }
    }
  }
}
```

### The Evidence
EAS build logs show exactly what's happening:
```
Environment variables loaded from "development" environment on EAS: EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
Environment variables loaded from build profile "env": EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
The values from the build profile configuration will be used.  ← Problem!
```

**End of post-mortem.** If that's all you needed, you're done. Below is the complete walkthrough.

---

## Part 2: Complete Setup Guide

### What is EAS?

**EAS (Expo Application Services)** is Expo's cloud build service. Instead of building your React Native app locally, EAS compiles it on their servers and gives you an installable APK/IPA.

**Why use secrets?** API keys, Firebase credentials, and other sensitive values shouldn't be committed to git. EAS secrets let you inject them at build time without exposing them in your codebase.

---

### Step 1: Create Your EAS Secrets

First, make sure you have EAS CLI installed:
```bash
npm install -g eas-cli
eas login
```

Create your secrets:
```bash
# Google Maps API Key
eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID \
  --value "AIzaSyYourActualKeyHere"

# Verify it was created
eas secret:list
```

**What this does:** Stores your API key on Expo's servers, encrypted. It will be injected into your build environment automatically.

---

### Step 2: Configure eas.json (The Right Way)

Here's a correct `eas.json` configuration:

```json
{
  "cli": {
    "version": ">= 14.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "development"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "APP_VARIANT": "production"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**Notice what's NOT in the `env` field:** Your API keys. They load automatically from EAS secrets.

---

### Step 3: Configure react-native-maps with Expo Config Plugin

In `app.config.js` or `app.config.ts`, set up the Google Maps provider for both Android and iOS:

```javascript
export default {
  expo: {
    name: "MyApp",
    // ... other config

    plugins: [
      [
        "react-native-maps",
        {
          // Uses Google Maps provider instead of Apple Maps on iOS
          "googleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS
        }
      ]
    ],

    android: {
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID,
        },
      },
    },

    ios: {
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS,
      },
    },
  },
};
```

**In your MapView component:**
```jsx
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

<MapView
  provider={PROVIDER_GOOGLE}  // Force Google Maps on both platforms
  style={{ flex: 1 }}
  region={region}
/>
```

**How it works:** During EAS build, `process.env.EXPO_PUBLIC_GOOGLE_API_KEY_*` contains your actual API key (from the secret you created). The Expo config plugin injects this into the native Android/iOS configuration.

---

### Step 4: Handle File-Based Secrets (google-services.json)

Some secrets are files, not strings. For Firebase's `google-services.json`:

**1. Encode the file:**
```bash
base64 -w 0 android/app/google-services.json
# Copy the output
```

**2. Create the secret:**
```bash
eas secret:create \
  --scope project \
  --name GOOGLE_SERVICES_JSON_BASE64 \
  --value "paste-your-base64-here"
```

**3. Create a build hook** (`scripts/setup-google-services.js`):
```javascript
const fs = require('fs');
const path = require('path');

const base64 = process.env.GOOGLE_SERVICES_JSON_BASE64;

if (base64) {
  const content = Buffer.from(base64, 'base64').toString('utf-8');
  const outputPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);

  console.log('✓ google-services.json created from secret');
}
```

**4. Register the hook** in `package.json`:
```json
{
  "scripts": {
    "eas-build-post-install": "node scripts/setup-google-services.js"
  }
}
```

---

### Step 5: Configure Google Cloud API Key Restrictions

Your API key should be restricted to your app. Here's how:

**1. Get your EAS build's SHA-1 fingerprint:**
```bash
eas credentials --platform android
```
Look for the "Keystore" section and copy the SHA-1.

**2. In Google Cloud Console:**
- Go to APIs & Services → Credentials
- Click your API key
- Under "Application restrictions", select "Android apps"
- Add an item:
  - Package name: `com.yourcompany.yourapp`
  - SHA-1: (paste from step 1)

**3. Enable required APIs:**
- Maps SDK for Android
- Maps SDK for iOS (if applicable)

---

### Step 6: Build and Verify

```bash
eas build --platform android --profile development
```

**Check the build logs for this pattern:**

✅ **Correct** (secret loads from EAS, not overridden):
```
Environment variables from "development" environment on EAS: EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
Environment variables from build profile "env": APP_VARIANT
```

❌ **Wrong** (secret is being overridden):
```
Environment variables from "development" environment on EAS: EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
Environment variables from build profile "env": EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
The values from the build profile configuration will be used.
```

If you see the second pattern, you have a reference in your `eas.json` that needs to be removed.

---

## Common Mistakes

| Mistake | Why It's Wrong |
|---------|---------------|
| `"API_KEY": "@API_KEY"` | Literal string, not interpolation |
| `"API_KEY": "$(API_KEY)"` | Literal string, not interpolation |
| `"API_KEY": "$API_KEY"` | Literal string, not interpolation |
| `"API_KEY": "${API_KEY}"` | Literal string, not interpolation |

**The correct approach:** Don't include the variable in `eas.json` at all. It auto-loads.

---

## Troubleshooting Checklist

- [ ] Secret exists: `eas secret:list` shows your variable
- [ ] No override in eas.json: Your secret isn't in the `env` field
- [ ] Build logs confirm: Secret loads from EAS, not build profile
- [ ] API enabled: Google Cloud Console has Maps SDK enabled
- [ ] Key restricted correctly: SHA-1 matches EAS keystore
- [ ] Native logs clean: `adb logcat | grep -i maps` shows no API key errors

---

## Quick Reference

```bash
# Create a secret
eas secret:create --scope project --name MY_SECRET --value "secret-value"

# List secrets
eas secret:list

# Delete a secret
eas secret:delete MY_SECRET

# Get EAS keystore SHA-1
eas credentials --platform android

# Build with logs
eas build --platform android --profile development
```

---

## Key Takeaways

1. **EAS secrets auto-inject** — no syntax needed to reference them
2. **eas.json `env` overrides secrets** — only put non-sensitive config there
3. **There is no interpolation syntax** — `@`, `$()`, `${}` all become literals
4. **Read the build logs** — they tell you exactly what's being used
5. **SHA-1 matters** — EAS keystore differs from local debug keystore

---

## FAQ: Common Google Maps + Expo EAS Issues

### Q: Why does react-native-maps work locally but not in EAS build?
**A:** Local development uses your machine's environment variables. EAS builds run on Expo's servers where only EAS secrets are available. If you reference secrets incorrectly in `eas.json`, they become literal strings.

### Q: Do I need the react-native-maps config plugin?
**A:** Yes, for Expo managed workflow. The config plugin (`expo-config-plugin`) automatically configures native Android and iOS projects with your Google Maps API key during prebuild.

### Q: Google Maps works on Android but not iOS (or vice versa)?
**A:** Check that you've:
1. Created separate API keys for each platform (or one unrestricted key for development)
2. Enabled both "Maps SDK for Android" AND "Maps SDK for iOS" in Google Cloud Console
3. Set both `EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID` and `EXPO_PUBLIC_GOOGLE_API_KEY_IOS` secrets

### Q: I see "Google Maps cannot be loaded" on iOS
**A:** Ensure your `app.config.js` includes the iOS config:
```javascript
ios: {
  config: {
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS,
  },
}
```

### Q: Maps show but tiles are gray/missing
**A:** This usually means the API key is being sent but is invalid or restricted incorrectly. Check your Google Cloud Console API key restrictions match your app's bundle ID and SHA-1 fingerprint.

### Q: How do I debug Google Maps API key issues?
**A:** Use native logs:
```bash
# Android
adb logcat | grep -i "maps\|api\|key"

# iOS (in Xcode)
# Filter console for "Google" or "Maps"
```

---

## Related Searches This Article Answers

- expo eas build google maps not loading
- react-native-maps google provider not working eas
- expo config plugin react-native-maps api key
- eas.json environment variables not working
- google maps api key not set expo build
- react-native-maps blank map eas build
- expo managed workflow google maps android ios
- EXPO_PUBLIC environment variable not available eas build

---

*Found this helpful? Share it with someone debugging the same issue. Questions? Drop a comment below.*

**Tags:** `#ReactNative` `#Expo` `#EAS` `#GoogleMaps` `#react-native-maps` `#MobileDevelopment` `#Android` `#iOS` `#2025`
