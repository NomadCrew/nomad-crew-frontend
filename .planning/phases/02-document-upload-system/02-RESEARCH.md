# Phase 2: Document Upload System - Research

**Researched:** 2026-01-10
**Domain:** React Native/Expo file picking and Supabase Storage upload
**Confidence:** HIGH

<research_summary>
## Summary

Researched the Expo SDK and Supabase Storage ecosystem for building a document upload system in React Native. The standard approach uses `expo-image-picker` for photos/camera, `expo-document-picker` for PDFs and other documents, `expo-image-manipulator` for image compression, and Supabase Storage JS client for uploads.

Key finding: React Native requires special handling for file uploads - standard `Blob`/`File`/`FormData` do not work reliably. The recommended pattern is to convert files to `ArrayBuffer` using `fetch().then(res => res.arrayBuffer())` before uploading to Supabase Storage. This is critical for cross-platform reliability.

**Primary recommendation:** Use expo-image-picker + expo-document-picker for file selection, expo-image-manipulator for compression (images only), and ArrayBuffer-based uploads to Supabase Storage. Implement progress tracking via upload state, not native progress callbacks (not well supported in React Native).
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-image-picker | ~16.0.6 | Pick images from gallery/camera | Official Expo solution, handles permissions automatically |
| expo-document-picker | ~13.0.3 | Pick PDFs and other documents | Works with cloud providers, supports MIME filtering |
| expo-file-system | ~18.0.12 | Read files, manage cache | Already included in Expo SDK 52 |
| expo-image-manipulator | ~13.0.6 | Compress/resize images | Official Expo, reduces file size 80-90% |
| @supabase/supabase-js | ^2.86.2 | Storage upload/download | Already installed, well-integrated |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-url-polyfill | ^2.0.0 | URL API polyfill | Already installed - required for Supabase |
| base64-js | ^1.5.1 | Base64 encoding | Already installed - for ArrayBuffer conversion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-image-picker | react-native-image-crop-picker | More features but requires bare workflow |
| expo-image-manipulator | react-native-compressor | More compression options but separate native module |
| Standard upload | TUS resumable upload | TUS has React Native issues (files stuck at 6MB) |
| Manual progress | Uppy client | Uppy doesn't work 100% in React Native yet |

**Installation:**
```bash
npx expo install expo-image-picker expo-document-picker expo-image-manipulator
```
Note: expo-file-system is already bundled with Expo SDK 52.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Service Structure
```
src/features/wallet/
├── services/
│   ├── index.ts              # Re-exports
│   ├── documentPicker.ts     # File picking abstraction
│   ├── imageCompressor.ts    # Image manipulation wrapper
│   └── storageUpload.ts      # Supabase upload service
├── hooks/
│   ├── useDocumentPicker.ts  # Hook for picking documents
│   └── useDocumentUpload.ts  # Hook for upload with state
└── store.ts                  # Upload state management
```

### Pattern 1: File Selection Abstraction
**What:** Unified interface for both image and document picking
**When to use:** Any document upload feature
**Example:**
```typescript
// Source: Expo docs + Supabase tutorial
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface PickedFile {
  uri: string;
  mimeType: string;
  name: string;
  size?: number;
}

export async function pickImage(): Promise<PickedFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8, // Pre-compress at selection
    exif: false,  // Don't need metadata
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    name: asset.fileName ?? `image-${Date.now()}.jpg`,
    size: asset.fileSize,
  };
}

export async function pickDocument(
  types: string[] = ['application/pdf', 'image/*']
): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: types,
    copyToCacheDirectory: true, // Required for file system access
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    name: asset.name,
    size: asset.size,
  };
}
```

### Pattern 2: React Native ArrayBuffer Upload
**What:** Convert file URI to ArrayBuffer for Supabase upload (React Native specific)
**When to use:** All uploads from React Native
**Example:**
```typescript
// Source: Supabase Expo tutorial (verified)
import { supabase } from '@/src/api/supabase';

export async function uploadToStorage(
  bucket: string,
  path: string,
  fileUri: string,
  contentType: string
): Promise<{ path: string } | null> {
  // Critical: Convert to ArrayBuffer for React Native
  const arraybuffer = await fetch(fileUri).then((res) => res.arrayBuffer());

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, arraybuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data;
}
```

### Pattern 3: Image Compression Before Upload
**What:** Resize and compress images to reduce upload size and storage costs
**When to use:** Before uploading any image (profile photos, documents)
**Example:**
```typescript
// Source: Expo ImageManipulator docs
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 1920; // Cap at 1920px width/height
const COMPRESSION_QUALITY = 0.8;

export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }], // Maintains aspect ratio
    {
      compress: COMPRESSION_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
}
```

### Pattern 4: Upload State Management
**What:** Track upload progress via state since native progress isn't reliable
**When to use:** User-facing upload UI
**Example:**
```typescript
// In Zustand store
interface UploadState {
  uploadProgress: number | null; // 0-100 or null if not uploading
  uploadError: string | null;
  isUploading: boolean;
}

// Usage pattern (simplified - no real progress from Supabase)
const uploadDocument = async (file: PickedFile) => {
  set({ isUploading: true, uploadProgress: 0 });

  try {
    // Compression step (if image)
    if (file.mimeType.startsWith('image/')) {
      set({ uploadProgress: 20 }); // Compressing
      file.uri = await compressImage(file.uri);
    }

    set({ uploadProgress: 50 }); // Uploading
    const result = await uploadToStorage('wallet-documents', path, file.uri, file.mimeType);

    set({ uploadProgress: 100, isUploading: false });
    return result;
  } catch (error) {
    set({ uploadError: error.message, isUploading: false, uploadProgress: null });
    throw error;
  }
};
```

### Anti-Patterns to Avoid
- **Using FormData/Blob directly:** Doesn't work reliably in React Native - use ArrayBuffer
- **Loading entire file into memory via base64:** Causes memory issues for large files
- **TUS resumable uploads for files <50MB:** Has known issues in React Native, standard upload is more reliable
- **Skipping compression:** Wastes bandwidth and storage, uploads can take 6-8x longer
- **Not setting copyToCacheDirectory: true:** DocumentPicker files may not be readable
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom canvas manipulation | expo-image-manipulator | Native performance, handles formats correctly |
| File picking UI | Custom file browser | expo-document-picker | Accesses system providers, cloud services |
| Permission handling | Manual permission requests | expo-image-picker handles it | Platform differences, edge cases handled |
| MIME type detection | String parsing | Trust picker's mimeType | More reliable, handles edge cases |
| ArrayBuffer conversion | Custom base64 decode | fetch().arrayBuffer() | Standard, handles encoding correctly |
| Storage paths | Manual string concat | Path utility functions | Prevent injection, handle special characters |

**Key insight:** React Native file handling has subtle platform differences between iOS and Android. The Expo packages abstract these differences and handle edge cases (permissions, file access, encoding) that custom solutions miss. The Supabase ArrayBuffer pattern is specifically designed for React Native and is the only reliable method.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: File Not Readable After Picking
**What goes wrong:** DocumentPicker returns a file URI that expo-file-system can't read
**Why it happens:** File is in a protected location, not copied to cache
**How to avoid:** Always set `copyToCacheDirectory: true` in DocumentPicker options
**Warning signs:** "File not found" or permission errors after picking

### Pitfall 2: Memory Crash on Large Files
**What goes wrong:** App crashes when uploading files >100MB
**Why it happens:** Loading entire file into memory as ArrayBuffer
**How to avoid:** Set file size limits (10MB for wallet documents), compress images first
**Warning signs:** App becomes unresponsive, then crashes around 600MB threshold

### Pitfall 3: Upload Stuck or Timeout
**What goes wrong:** Upload hangs indefinitely or times out
**Why it happens:** Using FormData/Blob instead of ArrayBuffer, or file too large
**How to avoid:** Use ArrayBuffer pattern, implement timeout handling
**Warning signs:** No error returned, upload percentage stays at 0

### Pitfall 4: Wrong MIME Type in Storage
**What goes wrong:** Downloaded files don't open correctly
**Why it happens:** Not passing contentType to upload, or wrong type detected
**How to avoid:** Always pass explicit `contentType` from picker result
**Warning signs:** Files download but can't be viewed, wrong file icons

### Pitfall 5: iOS Picker Opens Wrong Interface
**What goes wrong:** DocumentPicker shows photos instead of files on iOS
**Why it happens:** iOS uses Uniform Type Identifiers, not MIME types
**How to avoid:** Use correct type strings (iOS: 'public.item', 'com.adobe.pdf')
**Warning signs:** User can only select photos when trying to pick PDFs

### Pitfall 6: Image Not Compressed
**What goes wrong:** Images upload as 5-10MB instead of <1MB
**Why it happens:** Not calling manipulateAsync before upload
**How to avoid:** Always compress before upload, cap at 1920px dimension
**Warning signs:** Slow uploads, high storage usage, poor mobile experience
</common_pitfalls>

<code_examples>
## Code Examples

### Complete Upload Flow
```typescript
// Source: Supabase Expo tutorial + Context7 verified
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/src/api/supabase';

export async function uploadWalletDocument(
  userId: string,
  walletType: 'personal' | 'group',
  tripId?: string
): Promise<string> {
  // 1. Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 1, // Full quality, we'll compress separately
    exif: false,
  });

  if (result.canceled || !result.assets[0]) {
    throw new Error('No image selected');
  }

  const image = result.assets[0];

  // 2. Compress image
  const compressed = await ImageManipulator.manipulateAsync(
    image.uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  // 3. Convert to ArrayBuffer (React Native requirement)
  const arraybuffer = await fetch(compressed.uri).then((res) => res.arrayBuffer());

  // 4. Generate storage path
  const fileExt = 'jpeg';
  const storagePath = walletType === 'personal'
    ? `personal/${userId}/${Date.now()}.${fileExt}`
    : `trips/${tripId}/${Date.now()}.${fileExt}`;

  // 5. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('wallet-documents')
    .upload(storagePath, arraybuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path;
}
```

### Document Picker with Type Filtering
```typescript
// Source: Expo DocumentPicker docs
import * as DocumentPicker from 'expo-document-picker';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
];

export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ALLOWED_TYPES,
    copyToCacheDirectory: true, // Critical for file access
    multiple: false,
  });

  if (result.canceled) return null;

  const file = result.assets[0];

  // Validate file size (10MB limit)
  if (file.size && file.size > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  return {
    uri: file.uri,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
  };
}
```

### Signed URL for Viewing
```typescript
// Source: Supabase Storage docs
export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('wallet-documents')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

// For downloading to display
export async function downloadDocument(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('wallet-documents')
    .download(storagePath);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  // Convert blob to data URL for display
  const fr = new FileReader();
  return new Promise((resolve, reject) => {
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('Failed to read file'));
    fr.readAsDataURL(data);
  });
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ImagePicker.MediaTypeOptions enum | String array ['images'] | Expo SDK 52 | MediaTypeOptions deprecated |
| FormData upload | ArrayBuffer upload | Supabase v2 | Only reliable method for RN |
| manipulateAsync actions.resize | Still current | - | API stable |
| TUS for all files | TUS only for >50MB | 2024 | Standard upload more reliable |

**New tools/patterns to consider:**
- **expo/fetch (SDK 52):** New fetch implementation with better FormData support - worth testing
- **Supabase Storage V3:** Includes improved resumable uploads, but React Native support still limited
- **WebP format:** Supported on both iOS and Android now, better compression than JPEG

**Deprecated/outdated:**
- **ImagePicker.MediaTypeOptions.All:** Use ['images', 'videos'] array instead
- **Blob/File constructors for upload:** Don't work reliably in React Native
- **Manual permission handling:** expo-image-picker handles automatically
</sota_updates>

<open_questions>
## Open Questions

1. **TUS Resumable Upload Stability**
   - What we know: Known issues with files >6MB in React Native
   - What's unclear: Whether recent Supabase updates fixed this
   - Recommendation: Use standard upload for Phase 2, revisit TUS in Phase 9 (Offline Sync) if needed for large files

2. **expo/fetch vs standard fetch**
   - What we know: SDK 52 includes new expo/fetch with better FormData support
   - What's unclear: Whether it works better for Supabase uploads than ArrayBuffer
   - Recommendation: Stick with ArrayBuffer (proven), test expo/fetch as enhancement later

3. **Progress Tracking**
   - What we know: Native progress callbacks don't work reliably in React Native
   - What's unclear: Whether XMLHttpRequest onprogress works with Supabase
   - Recommendation: Use state-based progress indication (compressing, uploading, done) rather than percentage
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- /llmstxt/expo_dev_llms_txt - expo-image-picker, expo-document-picker, expo-image-manipulator docs
- /supabase/supabase-js - Storage upload API
- /websites/supabase - React Native upload tutorial with ArrayBuffer pattern
- Expo SDK 52 documentation - Current API signatures

### Secondary (MEDIUM confidence)
- https://supabase.com/blog/react-native-storage - Verified upload patterns
- https://docs.expo.dev/versions/latest/sdk/imagemanipulator/ - Compression API
- https://docs.expo.dev/versions/latest/sdk/document-picker/ - Document picker API

### Tertiary (LOW confidence - needs validation)
- WebSearch results on TUS issues - Community reports, not official
- react-native-compressor comparison - Community recommendation
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Expo SDK 52 file handling + Supabase Storage
- Ecosystem: expo-image-picker, expo-document-picker, expo-image-manipulator
- Patterns: ArrayBuffer upload, compression, state-based progress
- Pitfalls: Memory issues, MIME types, platform differences

**Confidence breakdown:**
- Standard stack: HIGH - verified with Context7, matches existing codebase
- Architecture: HIGH - from Supabase official tutorial
- Pitfalls: HIGH - documented in issues and tutorials
- Code examples: HIGH - from Context7/official sources, verified

**Research date:** 2026-01-10
**Valid until:** 2026-02-10 (30 days - Expo ecosystem stable)
</metadata>

---

*Phase: 02-document-upload-system*
*Research completed: 2026-01-10*
*Ready for planning: yes*
