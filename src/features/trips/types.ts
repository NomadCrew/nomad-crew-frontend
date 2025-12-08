export type TripStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface WeatherForecast {
  time: string;
  temperature: number;
  precipitation: number;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  destination: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    placeId?: string;
  };
  startDate: string;
  endDate: string;
  status: TripStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Weather-related fields
  weatherTemp?: string;
  weatherCondition?: WeatherCondition;
  weatherForecast?: WeatherForecast[];
  backgroundImageUrl?: string;
  isGhostCard?: boolean;
  participantCount?: number;
  invitations?: {
    email: string;
    status: 'pending' | 'accepted' | 'expired';
    token: string;
    expiresAt: string;
  }[];
  members?: {
    userId: string;
    name?: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
  }[];
}

export type WeatherCondition = 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';

export interface CreateTripInput {
  name: string;
  description?: string;
  destination: {
    address: string;
    placeId: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startDate: Date;
  endDate: Date;
}

export interface UpdateTripInput {
  name?: string;
  description?: string;
  destination?: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    placeId?: string;
  };
  startDate?: string;
  endDate?: string;
}

export interface UpdateTripStatusRequest {
  status: TripStatus;
}

export interface UpdateTripStatusResponse {
  status: TripStatus;
  message: string;
}

// Response types for REST API
export type CreateTripResponse = Trip;
export type UpdateTripResponse = Trip;
export interface DeleteTripResponse {
  id: string;
  success: boolean;
}

export interface PlaceDetails {
  addressComponents: string[];
  coordinate: {
    latitude: number;
    longitude: number;
  };
  formattedAddress: string;
  name: string;
  placeId: string;
}

// Invitation types
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface InvitationDetails {
  id: string;
  tripId: string;
  email: string;
  status: InvitationStatus;
  role: MemberRole;
  createdAt: string;
  expiresAt?: string;
  trip?: {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  };
  inviter?: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarURL?: string;
  };
}

export interface InvitationError {
  title: string;
  message: string;
  action?: 'go_to_trips' | 'switch_account' | 'view_trip' | 'retry';
  tripId?: string;
}
