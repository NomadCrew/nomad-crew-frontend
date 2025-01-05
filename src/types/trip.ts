export interface Trip {
    id: number;
    name: string;
    description?: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    participantCount: number;
    isArchived?: boolean;
  }