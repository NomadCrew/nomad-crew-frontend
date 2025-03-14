import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useTripStore } from '@/src/store/useTripStore';

interface LocationModalProps {
  tripId: string;
  onClose: () => void;
}

// This component is kept for backward compatibility
// It now redirects to the standalone location screen
export const LocationModal: React.FC<LocationModalProps> = ({
  tripId,
  onClose,
}) => {
  useEffect(() => {
    // Navigate to the standalone location screen
    router.push(`/location/${tripId}`);
    
    // Call onClose to clean up any modal state in the parent component
    onClose();
  }, [tripId, onClose]);
  
  // Return null as we're just redirecting
  return null;
}; 