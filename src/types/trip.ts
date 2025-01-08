export type TripStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: number;
  name: string;
  description?: string;
  destination: string;
  startDate: Date;
  endDate: Date;
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