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
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Stack navigator params
export type AppStackParamList = Pick<
  RootStackParamList, 
  'Home' | 'Trips' | 'Profile' | 'Settings' | 'Chat' | 'TripDetails' | 'Location'
>;

// Tab navigator params
export type AppTabParamList = Pick<
  RootStackParamList,
  'Home' | 'Trips' | 'Profile'
>;

// Auth navigator params
export type AuthStackParamList = Pick<
  RootStackParamList,
  'Login' | 'Register' | 'ForgotPassword' | 'VerifyEmail'
>; 