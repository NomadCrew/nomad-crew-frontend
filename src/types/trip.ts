export type TripStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  name: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  createdBy: number; 
  participantCount: number;
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
}