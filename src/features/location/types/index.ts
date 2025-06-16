import * as Location from 'expo-location';

export interface MemberLocation {
  userId: string;
  name?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  };
}

export interface LocationState {
  // Settings
  isLocationSharingEnabled: boolean;
  setLocationSharingEnabled: (enabled: boolean, tripId?: string) => Promise<void>;
  
  // Current user's location
  currentLocation: Location.LocationObject | null;
  locationError: string | null;
  isTrackingLocation: boolean;
  
  // Trip member locations
  memberLocations: Record<string, Record<string, MemberLocation>>;
  
  // Location tracking subscription
  locationSubscription: Location.LocationSubscription | null;
  currentTripId: string | null;
  
  // Actions
  startLocationTracking: (tripId: string) => Promise<void>;
  stopLocationTracking: () => void;
  updateLocation: (location: Location.LocationObject) => Promise<void>;
  
  // Member location management
  getMemberLocations: (tripId: string) => Promise<MemberLocation[]>;
  updateMemberLocation: (tripId: string, memberLocation: MemberLocation) => void;
  clearMemberLocations: (tripId: string) => void;
  
  // Initialization
  init?: () => Promise<void>; // Optional because it's called internally
} 