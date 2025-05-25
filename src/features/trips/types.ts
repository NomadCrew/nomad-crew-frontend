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

// Supabase Realtime Types for Trips Features

export interface ChatMessage {
  id: string;
  trip_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  reply_to_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessagePaginatedResponse {
  messages: ChatMessage[];
  pagination: {
    next_cursor?: string;
    has_more: boolean;
  };
}

export interface SendMessageRequest {
  message: string;
  replyToId?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface Location {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  is_sharing_enabled: boolean;
  privacy_level: 'hidden' | 'approximate' | 'precise';
  created_at: string;
  updated_at: string;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number; // milliseconds
}

export interface UserPresence {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  trip_id: string;
  is_online: boolean;
  is_typing: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  emoji: string;
  created_at: string;
}

export interface AddReactionRequest {
  emoji: string;
}

export interface ChatReadReceipt {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  trip_id: string;
  message_id: string;
  read_at: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateLastReadRequest {
  last_message_id: string;
}

// Supabase Realtime Event Types
export type SupabaseRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SupabaseRealtimePayload<T = any> {
  eventType: SupabaseRealtimeEvent;
  new: T;
  old: T;
  errors: any[];
}

// Feature Flag Types
export interface FeatureFlagResponse {
  supabase_realtime_enabled: boolean;
}

// Error Types for Realtime
export interface RealtimeError {
  code: string;
  message: string;
  details?: any;
} 