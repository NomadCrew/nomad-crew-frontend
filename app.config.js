const getEnvironment = () => {
  switch (process.env.APP_VARIANT) {
    case 'production':
      return 'production';
    default:
      return 'development';
  }
};

const ENV = getEnvironment();
const IS_DEV = ENV === 'development';

export default {
  expo: {
    name: IS_DEV ? 'NomadCrew (Dev)' : 'NomadCrew',
    slug: 'nomad-crew-frontend',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'nomadcrew',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
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
        : 'com.nomadcrew.app',
      usesAppleSignIn: true,
      config: {
        usesNonExemptEncryption: false,
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        UIBackgroundModes: [
          'remote-notification'
        ]
      },
      googleServicesFile: IS_DEV 
        ? process.env.GOOGLE_SERVICES_DEV_FILE || './ios/GoogleService-Info.dev.plist'
        : process.env.GOOGLE_SERVICES_PROD_FILE || './ios/GoogleService-Info.plist'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: IS_DEV 
        ? 'com.nomadcrew.app.dev' 
        : 'com.nomadcrew.app',
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'nomadcrew.uk',
              pathPrefix: '/auth/callback'
            },
            {
              scheme: 'https',
              host: 'efmqiltdajyqenndmykz.supabase.co',
              pathPrefix: '/auth/v1/callback'
            },
            {
              scheme: 'nomadcrew',
              host: '*',
              pathPrefix: '/auth/callback'
            }
          ],
          category: ['BROWSABLE', 'DEFAULT']
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'nomadcrew',
              host: 'invite',
              pathPrefix: '/accept'
            },
            {
              scheme: 'https',
              host: 'nomadcrew.uk',
              pathPrefix: '/invite/accept'
            }
          ],
          category: ['BROWSABLE', 'DEFAULT']
        }
      ]
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
      config: {
        supabase: {
          url: 'https://efmqiltdajvqenndmylz.supabase.co'
        }
      }
    },
    plugins: [
      'expo-router',
      ['expo-location', {
        locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.'
      }],
      'expo-secure-store', 
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: '34.0.0'
          },
          ios: {
            deploymentTarget: '15.1'
          }
        }
      ],
      ['expo-apple-authentication', {
        serviceId: IS_DEV 
          ? 'com.nomadcrew.app.dev' 
          : 'com.nomadcrew.app',
        teamId: '27DC66D35A'
      }],
      ['expo-splash-screen', {
        image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }],
      ['expo-font', {
        fonts: [
          './assets/fonts/SpaceMono-Regular.ttf'
        ]
      }],
      ['expo-notifications', {
        icon: './assets/images/icon.png',
        color: '#000000'
      }]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: '50d59d51-34e0-49ab-a7ee-6989ed09f8ef'
      },
      environment: ENV
    },
    owner: 'nomad-crew',
    updates: {
      url: 'https://u.expo.dev/50d59d51-34e0-49ab-a7ee-6989ed09f8ef'
    }
  }
};