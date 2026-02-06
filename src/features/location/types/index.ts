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
  setLocationSharingEnabled: (enabled: boolean) => Promise<void>;

  // Current user's location
  currentLocation: Location.LocationObject | null;
  locationError: string | null;
  isTrackingLocation: boolean;

  // Active trip for location tracking (locations are trip-specific)
  activeTripId: string | null;

  // Trip member locations
  memberLocations: Record<string, Record<string, MemberLocation>>;

  // Location tracking subscription
  locationSubscription: Location.LocationSubscription | null;

  // Actions
  startLocationTracking: (tripId: string) => Promise<void>;
  stopLocationTracking: () => void;
  updateLocation: (location: Location.LocationObject, tripId: string) => Promise<void>;

  // Member location management
  getMemberLocations: (tripId: string) => Promise<MemberLocation[]>;
  updateMemberLocation: (tripId: string, memberLocation: MemberLocation) => void;
  clearMemberLocations: (tripId: string) => void;

  // Initialization
  init?: () => Promise<void>; // Optional because it's called internally

  // Reset
  reset: () => void;
}
