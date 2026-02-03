# EAS Secrets & Environment Variables: The Definitive Guide

> **TL;DR**: Don't put EAS secrets in `eas.json` `env` field - they auto-load and your references will override them with literal strings.

## The Problem We Solved

After extensive debugging of Google Maps not loading in our React Native Expo app, we discovered a critical misunderstanding about how EAS secrets work.

### Symptoms
- Google Maps showing infinite loading spinner on Android
- Native logs showing literal string: `API Key: $(EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID)` or `@EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID`
- Push notifications failing with FIS_AUTH_ERROR
- Map worked locally but not in EAS cloud builds

### Root Cause
**EAS secrets are automatically injected into builds - you don't need to reference them in `eas.json`.**

When you add a secret reference like `@SECRET_NAME` or `$(SECRET_NAME)` in the `env` field of `eas.json`, that literal string overrides the actual secret value that EAS would have automatically loaded.

## How EAS Environment Variables Actually Work

### 1. Creating Secrets

```bash
# Create a project-scoped secret
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID --value "AIzaSy..."

# Or use the EAS dashboard at expo.dev
```

### 2. Automatic Loading

When you run `eas build`, EAS automatically:
1. Loads all secrets from your project's environment (development, preview, production)
2. Makes them available as `process.env.SECRET_NAME` during the build
3. Injects `EXPO_PUBLIC_*` prefixed variables into the client bundle

### 3. The Override Trap (What NOT to Do)

```json
// ❌ WRONG - These literal strings will override the real secrets!
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID": "@EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID",
        "EXPO_PUBLIC_GOOGLE_API_KEY_IOS": "$(EXPO_PUBLIC_GOOGLE_API_KEY_IOS)"
      }
    }
  }
}
```

EAS build logs will show:
```
Environment variables loaded from the "development" environment on EAS: EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID...
Environment variables loaded from the "development" build profile "env" configuration: EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID...
The following environment variables are defined in both... The values from the build profile configuration will be used.
```

**"The values from the build profile configuration will be used"** - This means your literal `@SECRET_NAME` string overwrites the real secret!

### 4. The Correct Approach

```json
// ✅ CORRECT - Only include non-secret values in env
{
  "build": {
    "development": {
      "env": {
        "APP_VARIANT": "development",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "369652278516-xxx.apps.googleusercontent.com"
      }
      // Secrets like EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID are auto-loaded from EAS!
    }
  }
}
```

## Complete Setup Guide

### Step 1: Create EAS Secrets

```bash
# Google Maps API Key (restricted to your app's SHA-1 and package name)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID --value "AIzaSy..."
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_API_KEY_IOS --value "AIzaSy..."

# Firebase/Google Services (base64 encoded for file secrets)
# First encode your google-services.json:
# base64 -w 0 google-services.json > google-services.base64
eas secret:create --scope project --name GOOGLE_SERVICES_JSON_BASE64 --value "$(cat google-services.base64)"
```

### Step 2: Configure EAS Environments (Optional)

You can organize secrets by environment in the EAS dashboard:
- Go to expo.dev → Your Project → Settings → Environment Variables
- Create variables with "Sensitive" visibility for secrets
- Assign them to specific environments (development, preview, production)

### Step 3: Minimal eas.json

```json
{
  "cli": {
    "version": ">= 14.2.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "development"
        // NO secret references here!
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "distribution": "store",
      "env": {
        "APP_VARIANT": "production"
      }
    }
  }
}
```

### Step 4: Access Secrets in Code

```typescript
// Secrets are automatically available via process.env
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID;

// In app.config.ts
export default {
  // ...
  android: {
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID,
      },
    },
  },
};
```

## Handling File Secrets (google-services.json)

For files like `google-services.json` that shouldn't be in git:

### 1. Encode and Create Secret

```bash
base64 -w 0 android/app/google-services.json | eas secret:create --scope project --name GOOGLE_SERVICES_JSON_BASE64 --value -
```

### 2. Create Build Hook Script

```javascript
// scripts/setup-google-services.js
const fs = require('fs');
const path = require('path');

const base64Content = process.env.GOOGLE_SERVICES_JSON_BASE64;
if (base64Content) {
  const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
  const outputPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, decoded);
  console.log('google-services.json created from secret');
}
```

### 3. Add to package.json

```json
{
  "scripts": {
    "eas-build-post-install": "node scripts/setup-google-services.js"
  }
}
```

## Google Maps API Key Restrictions

For security, restrict your API key in Google Cloud Console:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your API key
3. Under "Application restrictions", select "Android apps"
4. Add your app's restrictions:
   - Package name: `com.yourcompany.yourapp`
   - SHA-1 fingerprint: Get from EAS with `eas credentials`

### Getting SHA-1 from EAS Keystore

```bash
eas credentials --platform android
# Look for "Keystore" section, note the SHA-1 fingerprint
# Add this to your Google Cloud Console API key restrictions
```

## Debugging Checklist

If Google Maps still doesn't work after EAS build:

- [ ] Check EAS build logs for "Environment variables loaded from..."
- [ ] Ensure your secret is NOT in the "build profile env configuration" list
- [ ] Verify API key restrictions include correct SHA-1 fingerprint
- [ ] Confirm `Maps SDK for Android` is enabled in Google Cloud Console
- [ ] Check native logs: `adb logcat | grep -i "maps\|google\|api"`

## Key Learnings

1. **EAS secrets auto-load** - No special syntax needed in eas.json
2. **eas.json env overrides secrets** - Only put non-sensitive values there
3. **`@` and `$()` are not interpolation** - They become literal strings
4. **SHA-1 fingerprints matter** - EAS uses different keystore than local
5. **Read the build logs** - They clearly show what values are being used

## References

- [Expo EAS Environment Variables](https://docs.expo.dev/eas/environment-variables/)
- [Configure EAS Build with eas.json](https://docs.expo.dev/build/eas-json/)
- [EAS Secrets Management](https://docs.expo.dev/eas/environment-variables/manage/)
