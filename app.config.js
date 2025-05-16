const SUPABASE_URL = 'https://efmqiltdajvqenndmylz.supabase.co';

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

// Extract client ID from the full URL for URL scheme
const getClientId = (fullClientId) => fullClientId?.split('.')[0] || '';
const IOS_CLIENT_ID = getClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

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
      resizeMode: 'cover',
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
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS,
        googlePlacesApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS
      },
      associatedDomains: [
        'applinks:nomadcrew.uk'
      ],
      infoPlist: {
        UIBackgroundModes: [
          'remote-notification'
        ],
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              'nomadcrew'
            ]
          },
          {
            CFBundleURLSchemes: [
              `com.googleusercontent.apps.${IOS_CLIENT_ID}`
            ]
          }
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#ffffff'
      },
      package: IS_DEV 
        ? 'com.nomadcrew.app.dev' 
        : 'com.nomadcrew.app',
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
        },
        googlePlaces: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
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
          url: SUPABASE_URL
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
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: `com.googleusercontent.apps.${IOS_CLIENT_ID}`
        }
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
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
          ? 'com.nomadcrew.app.dev.signin' 
          : 'com.nomadcrew.app.signin',
        teamId: '27DC66D35A'
      }],
      ['expo-splash-screen', {
        image: './assets/images/splash.png',
        resizeMode: 'cover',
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
      environment: ENV,
      googleClientIds: {
        ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      }
    },
    owner: 'nomad-crew',
    updates: {
      url: 'https://u.expo.dev/50d59d51-34e0-49ab-a7ee-6989ed09f8ef'
    }
  }
};