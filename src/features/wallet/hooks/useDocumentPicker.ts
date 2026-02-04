// src/features/wallet/hooks/useDocumentPicker.ts
// React hook for document/image picker functionality

import { useState, useCallback } from 'react';
import { pickImage, pickDocument, takePhoto, PickedFile } from '../services';

/**
 * Picker type options
 */
export type PickerType = 'image' | 'document' | 'camera';

/**
 * Hook for picking documents and images
 * Provides a clean API for UI components to pick files
 */
export function useDocumentPicker() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pick a file based on type
   * @param type - 'image' for gallery, 'document' for file picker, 'camera' for photo
   * @returns PickedFile or null if cancelled
   */
  const pick = useCallback(async (type: PickerType): Promise<PickedFile | null> => {
    setIsPickerOpen(true);
    setError(null);

    try {
      let result: PickedFile | null = null;

      switch (type) {
        case 'image':
          result = await pickImage();
          break;
        case 'document':
          result = await pickDocument();
          break;
        case 'camera':
          result = await takePhoto();
          break;
        default:
          throw new Error(`Unknown picker type: ${type}`);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick file';
      setError(message);
      throw err;
    } finally {
      setIsPickerOpen(false);
    }
  }, []);

  /**
   * Pick an image from the gallery
   */
  const pickImageFromGallery = useCallback(async (): Promise<PickedFile | null> => {
    return pick('image');
  }, [pick]);

  /**
   * Pick a document from the file system
   */
  const pickDocumentFromFiles = useCallback(async (): Promise<PickedFile | null> => {
    return pick('document');
  }, [pick]);

  /**
   * Take a photo with the camera
   */
  const takePhotoWithCamera = useCallback(async (): Promise<PickedFile | null> => {
    return pick('camera');
  }, [pick]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Core pick function
    pick,

    // Convenience methods
    pickImageFromGallery,
    pickDocumentFromFiles,
    takePhotoWithCamera,

    // State
    isPickerOpen,
    error,
    clearError,
  };
}
