# NomadCrew Mobile App - Development Setup

This guide covers setting up the NomadCrew mobile app for local development and preparing it for App Store/Play Store publishing.

## Prerequisites

1. **Node.js** (v18+ recommended)
2. **Expo CLI** - Comes with the project
3. **EAS CLI** - For building and submitting
4. **Xcode** (macOS only, for iOS development)
5. **Android Studio** (for Android development)
6. **Backend server** running locally or accessible

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values (see Configuration section)

# Start development server
npm start
```

## Configuration

### 1. Environment Variables (.env)

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

**Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://192.168.1.100:8080` |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` |
| `EXPO_PUBLIC_GOOGLE_API_KEY_IOS` | Google Maps iOS key | `AIza...` |
| `EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID` | Google Maps Android key | `AIza...` |

### 2. API URL for Local Development

The API URL depends on where the app runs:

| Environment | API URL |
|-------------|---------|
| iOS Simulator | `http://localhost:8080` |
| Android Emulator | `http://10.0.2.2:8080` |
| Physical Device | `http://<YOUR_LOCAL_IP>:8080` |
| Production | `https://api.nomadcrew.uk` |

**Finding your local IP:**
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows (PowerShell)
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
```

### 3. Backend CORS Configuration

When running the backend locally, ensure it allows your device's origin:

```bash
# In backend .env
ALLOWED_ORIGINS=*  # For development only
# Or specifically:
ALLOWED_ORIGINS=http://localhost:8080,http://10.0.2.2:8080,http://192.168.1.100:8080
```

## Running the App

### Development Mode (Expo Go - Limited)

Note: Some native features (Apple Sign-In, Google Sign-In, Push Notifications) require a development build.

```bash
npm start
# Then press 'i' for iOS simulator or 'a' for Android emulator
```

### Development Build (Recommended)

For full functionality including native modules:

```bash
# Login to EAS (first time only)
npx eas-cli login

# Build for iOS
npm run build:dev:ios

# Build for Android
npm run build:dev:android
```

After the build completes, download and install the app on your device/simulator, then:

```bash
npm run start:dev
```

## EAS Build Profiles

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| `development` | Local testing with dev client | Internal (ad-hoc) |
| `preview` | Testing before release | Internal (ad-hoc) |
| `production` | App Store/Play Store release | Store |

## Publishing to App Stores

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Enroll at https://developer.apple.com
   - Create App ID and provisioning profiles

2. **Google Play Console Account** ($25 one-time)
   - Register at https://play.google.com/console
   - Create app listing

3. **EAS Account Setup**
   ```bash
   npx eas-cli login
   npx eas-cli account:view
   ```

### iOS App Store

1. **Configure Credentials**
   ```bash
   npx eas-cli credentials
   # Follow prompts to set up:
   # - Distribution certificate
   # - Provisioning profile
   ```

2. **Build for Production**
   ```bash
   npm run build:prod:ios
   ```

3. **Submit to App Store**
   ```bash
   npm run submit:ios
   ```

### Google Play Store

1. **Service Account Setup**
   - Create service account in Google Cloud Console
   - Grant access in Play Console
   - Download JSON key to `android/service-account.json`

2. **Build for Production**
   ```bash
   npm run build:prod:android
   ```

3. **Submit to Play Store**
   ```bash
   npm run submit:android
   ```

## Over-The-Air (OTA) Updates

EAS Update allows pushing JavaScript updates without a new store release:

```bash
# Push update to preview
npm run update:preview

# Push update to production
npm run update:production
```

## Troubleshooting

### Connection Issues

1. **Cannot connect to API**
   - Verify backend is running: `curl http://localhost:8080/health`
   - Check firewall settings
   - For physical device, ensure same WiFi network
   - Check API_URL in console logs

2. **WebSocket connection fails**
   - Verify WebSocket URL (should use `ws://` or `wss://`)
   - Check backend logs for connection attempts
   - Ensure JWT token is valid

### Build Issues

1. **EAS build fails**
   ```bash
   # Clear cache and retry
   eas build --clear-cache --profile development --platform ios
   ```

2. **Dependencies conflict**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

### Expo Issues

1. **Metro bundler issues**
   ```bash
   npm start -- --clear
   # Or
   npx expo start -c
   ```

2. **Native module not found**
   - You likely need a development build, not Expo Go
   - Run `npm run build:dev:ios` or `npm run build:dev:android`

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run start:dev` | Start with dev client |
| `npm run build:dev:ios` | Build iOS development app |
| `npm run build:dev:android` | Build Android development app |
| `npm run build:prod:ios` | Build iOS production app |
| `npm run build:prod:android` | Build Android production app |
| `npm run submit:ios` | Submit to App Store |
| `npm run submit:android` | Submit to Play Store |
| `npm test` | Run tests |
| `npm run lint` | Run linter |

## Environment-Specific Settings

The app automatically adjusts based on the `APP_VARIANT` environment variable:

| Variant | Bundle ID | App Name |
|---------|-----------|----------|
| `development` | `com.nomadcrew.app.dev` | NomadCrew (Dev) |
| `preview` | `com.nomadcrew.app.dev` | NomadCrew (Dev) |
| `production` | `com.nomadcrew.app` | NomadCrew |

## Security Notes

1. Never commit `.env` files with real credentials
2. Use different API keys for development and production
3. Enable API key restrictions in Google Cloud Console
4. Rotate keys periodically
