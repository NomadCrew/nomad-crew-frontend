export type TripStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  name: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  createdBy: string;
  participantCount: number;
  createdAt?: string;
  updatedAt?: string;
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