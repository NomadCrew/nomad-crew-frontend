import { BaseEvent } from './events';

export type TripStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
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
  startDate: string;
  endDate: string;
  participantCount?: number;
  status: TripStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  isGhostCard?: boolean;
  backgroundImageUrl?: string;
  weatherCondition?: string;
  weatherTemp?: string;
}

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
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  status?: TripStatus;
}

export interface UpdateTripStatusRequest {
  status: TripStatus;
}

export interface UpdateTripStatusResponse {
  message: string;
}

// Response types for REST API
export interface CreateTripResponse extends Trip {}
export interface UpdateTripResponse extends Trip {}
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