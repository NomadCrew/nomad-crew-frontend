const getEnvironment = () => {
  switch (process.env.APP_VARIANT) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    default:
      return 'development';
  }
};

const ENV = getEnvironment();
const IS_DEV = ENV === 'development';
const IS_STAGING = ENV === 'staging';

export default {
  expo: {
    name: IS_DEV ? 'NomadCrew (Dev)' : IS_STAGING ? 'NomadCrew (Staging)' : 'NomadCrew',
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
      bundleIdentifier: IS_DEV 
        ? 'com.nomadcrew.app.dev' 
        : IS_STAGING 
          ? 'com.nomadcrew.app.staging' 
          : 'com.nomadcrew.app',
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
      package: IS_DEV 
        ? 'com.nomadcrew.app.dev' 
        : IS_STAGING 
          ? 'com.nomadcrew.app.staging' 
          : 'com.nomadcrew.app',
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
      ["expo-apple-authentication"]
    ],
    extra: {
      eas: {
        projectId: '50d59d51-34e0-49ab-a7ee-6989ed09f8ef'
      },
      environment: ENV
    }
  }
};