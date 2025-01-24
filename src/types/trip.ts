export type TripStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  name: string;
  description?: string;
  destination: string;
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
export interface UpdateTripStatusRequest {
    status: TripStatus;
}

export interface UpdateTripStatusResponse {
    message: string;
}

export interface CreateTripInput {
  name: string;
  description?: string;
  destination: string;
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

export interface CreateTripRequest {
  name: string;
  description?: string;
  destination: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateTripResponse {
  id: string;
  name: string;
  description: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}