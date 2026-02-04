// src/features/wallet/services/documentPicker.ts
// Document and image picker abstraction for wallet documents

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Represents a file picked by the user
 */
export interface PickedFile {
  uri: string;
  mimeType: string;
  name: string;
  size?: number;
}

/**
 * Default document types allowed for picking
 */
const DEFAULT_DOCUMENT_TYPES = ['application/pdf', 'image/*'];

/**
 * Pick an image from the device gallery
 * @returns PickedFile or null if cancelled
 */
export async function pickImage(): Promise<PickedFile | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Media library permission is required to pick images');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    exif: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    name: asset.fileName ?? `image_${Date.now()}.jpg`,
    size: asset.fileSize,
  };
}

/**
 * Pick a document from the device
 * @param types - MIME types to allow (default: PDF and images)
 * @returns PickedFile or null if cancelled
 */
export async function pickDocument(
  types: string[] = DEFAULT_DOCUMENT_TYPES
): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: types,
    copyToCacheDirectory: true, // CRITICAL: Files won't be readable without this
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    name: asset.name,
    size: asset.size,
  };
}

/**
 * Take a photo using the device camera
 * @returns PickedFile or null if cancelled
 */
export async function takePhoto(): Promise<PickedFile | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission is required to take photos');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    exif: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    name: asset.fileName ?? `photo_${Date.now()}.jpg`,
    size: asset.fileSize,
  };
}
