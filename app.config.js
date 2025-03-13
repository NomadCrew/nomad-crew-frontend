const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'NomadCrew (Dev)' : 'NomadCrew',
    slug: 'nomad-crew-frontend',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'nomadcrew',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? 'com.nomadcrew.app.dev' : 'com.nomadcrew.app',
      usesAppleSignIn: true,
      config: {
        usesNonExemptEncryption: false,
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: IS_DEV ? 'com.nomadcrew.app.dev' : 'com.nomadcrew.app',
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },
    plugins: [
      ['expo-location'],
      ['expo-secure-store'],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 33,
            targetSdkVersion: 33,
            buildToolsVersion: '33.0.0'
          },
          ios: {
            deploymentTarget: '15.1'
          }
        }
      ],
      ["expo-apple-authentication"],
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          "webClientId": process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
        }
      ]
    ],
    extra: {
      eas: {
        projectId: '50d59d51-34e0-49ab-a7ee-6989ed09f8ef'
      }
    }
  }
};