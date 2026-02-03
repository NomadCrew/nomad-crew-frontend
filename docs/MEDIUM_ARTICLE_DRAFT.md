# Why Your Google Maps API Key Isn't Working in EAS Builds (And How We Fixed It After Hours of Debugging)

*The undocumented gotcha that will save you hours of frustration with Expo EAS secrets*

---

## The Setup

Picture this: You've built a beautiful React Native app with Expo. Google Maps works perfectly in development. You create your EAS secrets, configure your `eas.json`, and trigger a cloud build. You install the APK on your device and...

**The map shows an infinite loading spinner.**

No errors in the JavaScript console. The app runs fine. But the map just won't load.

Welcome to the debugging journey that took us down a rabbit hole of SHA-1 fingerprints, Firebase authentication, expo-location conflicts, and ultimately revealed a critical misunderstanding about how EAS secrets actually work.

---

## The Symptoms

Our NomadCrew app—a trip planning platform with real-time location sharing—suddenly had a broken map after migrating to EAS Build. Here's what we observed:

1. **Map showed infinite loading spinner** on Android physical devices
2. **Native logcat revealed the truth**: `API Key: @EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID`

Wait, what? That's not an API key—that's a literal string!

---

## The Investigation

### Red Herring #1: SHA-1 Fingerprint Mismatch

Our first instinct was correct but incomplete. EAS Build uses its own managed keystore, which has a different SHA-1 fingerprint than your local debug keystore.

```bash
# Get EAS keystore SHA-1
eas credentials --platform android
```

We added this SHA-1 to our Google Cloud Console API key restrictions. Push notifications started working (FIS_AUTH_ERROR was resolved), but the map still wouldn't load.

### Red Herring #2: expo-location Conflict

We discovered [Expo Issue #21103](https://github.com/expo/expo/issues/21103)—a known conflict between `expo-location` and `react-native-maps` on Android development builds. We added a delayed initialization workaround:

```typescript
const [isMapComponentReady, setIsMapComponentReady] = useState(
  Platform.OS !== 'android'
);

useEffect(() => {
  if (Platform.OS === 'android') {
    const timer = setTimeout(() => {
      setIsMapComponentReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }
}, []);
```

This helped with some edge cases, but the core issue remained.

### The Real Culprit: EAS Secret Override

After hours of debugging, we finally noticed something in the EAS build logs:

```
Environment variables loaded from the "development" environment on EAS:
  EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID...

Environment variables loaded from the "development" build profile "env" configuration:
  EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID...

The following environment variables are defined in both...
The values from the build profile configuration will be used.
```

**"The values from the build profile configuration will be used."**

This was the smoking gun.

---

## The Root Cause

Here's what our `eas.json` looked like:

```json
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

We assumed `@SECRET_NAME` was interpolation syntax—that EAS would replace it with the actual secret value. **We were wrong.**

### The Truth About EAS Secrets

**EAS secrets are automatically injected into your build environment. You don't need to reference them in `eas.json` at all.**

When you create a secret with:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID --value "AIzaSy..."
```

EAS automatically makes it available as `process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID` during the build. No configuration needed.

But here's the gotcha: **If you define the same variable in `eas.json`'s `env` field, your value overrides the secret.**

So our `@EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID` wasn't being interpolated—it was being used as the literal API key value!

---

## The Fix

The solution was embarrassingly simple. Remove the secret references from `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "APP_VARIANT": "development"
        // Secrets like EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
        // are auto-loaded from EAS - don't put them here!
      }
    }
  }
}
```

That's it. After this change, the build logs showed:

```
Environment variables from EAS: EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID...
Environment variables from build profile: APP_VARIANT...
```

No more conflict. The real API key was used. **The map finally loaded.**

---

## What The Documentation Doesn't Tell You

The [official Expo documentation](https://docs.expo.dev/eas/environment-variables/) explains how to create secrets and how they're available in your build. But it doesn't explicitly warn you about this override behavior.

The `eas.json` documentation even says the `env` field should only be used for "values you would commit to your git repository and not for passwords or secrets." But it doesn't explain *why*—that putting secrets there will actually break them.

### The Syntax Confusion

We searched extensively for documentation about `@SECRET_NAME` and `$(SECRET_NAME)` syntax. **Neither is a valid interpolation syntax in `eas.json`.**

- `@SECRET_NAME` → becomes literal string `@SECRET_NAME`
- `$(SECRET_NAME)` → becomes literal string `$(SECRET_NAME)`

These might work in shell scripts during the build, but not in the `eas.json` configuration itself.

---

## The Complete Debugging Checklist

If your Google Maps (or any API key) isn't working in EAS builds:

### 1. Check Your EAS Build Logs

Look for this warning:
```
The following environment variables are defined in both...
The values from the build profile configuration will be used.
```

If your API key variable is in this list, **remove it from `eas.json`**.

### 2. Verify Secrets Are Created

```bash
eas secret:list
```

### 3. Don't Reference Secrets in eas.json

```json
// ❌ WRONG
"env": {
  "EXPO_PUBLIC_API_KEY": "@EXPO_PUBLIC_API_KEY"
}

// ✅ CORRECT - just don't include it
"env": {
  "APP_VARIANT": "development"
}
```

### 4. Check SHA-1 Restrictions

```bash
eas credentials --platform android
```

Add the EAS keystore SHA-1 to your Google Cloud Console API key restrictions.

### 5. Verify API is Enabled

In Google Cloud Console, ensure "Maps SDK for Android" is enabled for your project.

---

## Key Takeaways

1. **EAS secrets auto-load** — No special syntax needed in `eas.json`
2. **eas.json `env` overrides secrets** — Only put non-sensitive values there
3. **`@` and `$()` are NOT interpolation** — They become literal strings
4. **Read the build logs** — They clearly show which values are being used
5. **SHA-1 fingerprints matter** — EAS uses different keystore than local development

---

## The Irony

After all this debugging, the fix was a three-line deletion. But those hours weren't wasted—they gave us deep understanding of:

- How EAS Build processes environment variables
- The relationship between EAS secrets and `eas.json` configuration
- Android native debugging with `adb logcat`
- Google API key restrictions and SHA-1 fingerprints
- The expo-location/react-native-maps conflict

Sometimes the most valuable lessons come from the most frustrating bugs.

---

## Resources

- [Expo EAS Environment Variables](https://docs.expo.dev/eas/environment-variables/)
- [Configure EAS Build with eas.json](https://docs.expo.dev/build/eas-json/)
- [expo-location conflict with react-native-maps (Issue #21103)](https://github.com/expo/expo/issues/21103)
- [Our full debugging documentation](https://github.com/NomadCrew/nomad-crew-frontend/blob/main/docs/EAS_SECRETS_GUIDE.md)

---

*Have you encountered similar issues with EAS secrets? Share your debugging stories in the comments!*

---

**Tags**: #ReactNative #Expo #EAS #GoogleMaps #Debugging #MobileDevelopment #JavaScript #TypeScript
