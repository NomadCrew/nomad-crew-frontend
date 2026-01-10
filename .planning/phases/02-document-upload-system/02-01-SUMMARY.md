---
phase: 02-document-upload-system
plan: 01
type: summary
---

# Plan 02-01 Summary: Service Layer

## Completed

**Duration:** Single session
**Status:** Complete

## What Was Built

### Task 1: Expo Dependencies Installed

Installed SDK 52 compatible packages:

- `expo-image-picker@16.0.6`
- `expo-document-picker@13.0.3`
- `expo-image-manipulator@13.0.6`

### Task 2: Document Picker & Compression Services

**`src/features/wallet/services/documentPicker.ts`**

- `PickedFile` interface for consistent file handling
- `pickImage()` - Gallery image picker with editing
- `pickDocument()` - Document picker with cache copy (critical for access)
- `takePhoto()` - Camera capture with editing

**`src/features/wallet/services/imageCompressor.ts`**

- `shouldCompress()` - Detects compressible image types
- `compressImage()` - Resizes to 1920px max, 80% JPEG quality
- `compressImageWithInfo()` - Returns compressed image with dimensions

### Task 3: Storage Upload Service

**`src/features/wallet/services/storageUpload.ts`**

- `STORAGE_BUCKET` = 'wallet-documents'
- `MAX_FILE_SIZE` = 10MB
- `generateStoragePath()` - Creates RLS-compliant paths
  - Personal: `personal/{userId}/{timestamp}_{name}`
  - Group: `trips/{tripId}/{timestamp}_{name}`
- `uploadDocument()` - **ArrayBuffer pattern** (critical for React Native)
- `getSignedUrl()` - Generates expiring access URLs
- `deleteDocument()` - Removes from storage bucket
- `isWithinSizeLimit()` - Size validation helper

### Re-exports

**`src/features/wallet/services/index.ts`** exports all:

- Types: `PickedFile`, `UploadResult`
- Constants: `STORAGE_BUCKET`, `MAX_FILE_SIZE`
- Picker: `pickImage`, `pickDocument`, `takePhoto`
- Compression: `compressImage`, `compressImageWithInfo`, `shouldCompress`
- Storage: `generateStoragePath`, `uploadDocument`, `getSignedUrl`, `deleteDocument`, `isWithinSizeLimit`

## Key Implementation Details

1. **ArrayBuffer Upload Pattern**: Standard FormData/Blob/File constructors don't work reliably in React Native. Used `fetch(uri).then(res => res.arrayBuffer())` before Supabase upload.

2. **copyToCacheDirectory: true**: Critical for DocumentPicker - without this, files aren't readable from their original location.

3. **Path Generation**: Follows Phase 1 RLS patterns for storage bucket policies.

4. **File Size Validation**: Enforced at upload time (bucket also rejects >10MB).

## Files Created/Modified

| File                                              | Action                     |
| ------------------------------------------------- | -------------------------- |
| `package.json`                                    | Modified (expo deps added) |
| `src/features/wallet/services/documentPicker.ts`  | Created                    |
| `src/features/wallet/services/imageCompressor.ts` | Created                    |
| `src/features/wallet/services/storageUpload.ts`   | Created                    |
| `src/features/wallet/services/index.ts`           | Updated                    |

## Verification

- [x] All three Expo packages installed and verified
- [x] No TypeScript errors in wallet services
- [x] Services follow RESEARCH.md patterns (ArrayBuffer upload)
- [x] Path generation matches Phase 1 RLS patterns

## Next Plan

**02-02: Store Integration and Hooks**

- Implement Zustand store CRUD actions
- Create `useDocumentPicker` and `useDocumentUpload` hooks
- Wire services to state management
