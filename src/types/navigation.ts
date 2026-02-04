import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Navigation type definitions for the app
 */

/**
 * Root Stack Parameter List for the main navigation stack
 */
export type RootStackParamList = {
  // Auth Routes
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Verification: { email: string };

  // Main App Routes
  AppInitializer: undefined;
  Home: NavigatorScreenParams<TabParamList>;

  // Tabs (wrapped in Home screen)
  '/': undefined;
  '/trips': undefined;
  '/explore': undefined;
  '/profile': undefined;
  '/notifications': undefined;

  // Trip Routes
  Trip: { id: string };
  TripDetail: { id: string };
  TripCreate: undefined;
  TripEdit: { id: string };
  TripInvite: { id: string };

  // Chat Routes
  Chat: { tripId: string };
  '/trips/[id]': { id: string };
  '/trips/[id]/chat': { id: string };

  // Location Routes
  '/location/[id]': { id: string };
  Location: { id: string };

  // Other Routes
  Settings: undefined;
  Notifications: undefined;
  Profile: undefined;
  Search: undefined;

  // Utility Routes
  '/+not-found': undefined;
};

/**
 * Tab Parameter List for the bottom tab navigator
 */
export type TabParamList = {
  Trips: undefined;
  Explore: undefined;
  Profile: undefined;
  Notifications: undefined;
};

/**
 * Declare global ParamList types
 * Note: We extend ReactNavigation with our types for type-safe navigation
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions
    type RootParamList = RootStackParamList;
  }
}

// Stack navigator params
export type AppStackParamList = Pick<
  RootStackParamList,
  'Home' | '/trips' | '/profile' | 'Settings' | 'Chat' | 'TripDetail' | 'Location'
>;

// Tab navigator params
export type AppTabParamList = Pick<RootStackParamList, 'Home' | '/trips' | '/profile'>;

// Auth navigator params
export type AuthStackParamList = Pick<
  RootStackParamList,
  'Login' | 'Register' | 'ForgotPassword' | 'Verification'
>;
