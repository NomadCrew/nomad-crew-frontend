import React from 'react';
import { GroupLiveMapModal } from '@/components/location/GroupLiveMapModal';
import { useTripStore } from '@/src/store/useTripStore';

interface LocationModalProps {
  tripId: string;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  tripId,
  onClose,
}) => {
  // Get the trip from the store
  const { trips } = useTripStore();
  const trip = trips.find(t => t.id === tripId);
  
  if (!trip) {
    console.error('Trip not found for LocationModal:', tripId);
    return null;
  }
  
  return (
    <GroupLiveMapModal
      visible={true}
      onClose={onClose}
      trip={trip}
    />
  );
}; 