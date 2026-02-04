# Phase 1: Foundation - Research

**Researched:** 2026-01-10
**Domain:** Supabase Storage + PostgreSQL schema for document wallet in React Native
**Confidence:** HIGH

<research_summary>
## Summary

Researched Supabase Storage integration patterns for React Native and database schema design for a document wallet feature. The standard approach uses Supabase Storage with ArrayBuffer conversion for React Native uploads, folder-based organization per user, and RLS policies for access control.

Key finding: React Native requires special handling for file uploads — **use ArrayBuffer from base64 data, not Blob/File**. The existing trip membership model (`members` array with roles) provides the foundation for group wallet access via a security definer function to avoid RLS recursion.

**Primary recommendation:** Use Supabase Storage with `base64-arraybuffer` for uploads, organize files as `{user_id}/{document_id}` for personal and `trips/{trip_id}/{document_id}` for group, leverage existing trip membership for group access RLS.
</research_summary>

<standard_stack>
## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.86 | Supabase client | Already integrated, handles auth + storage |
| `expo-file-system` | 18.0 | Local file operations | Read files for upload, cache for offline |
| `expo-image-picker` | 16.0 | Image selection | Native image picker UI |
| `expo-document-picker` | 13.0 | PDF/document selection | Native file picker for non-images |

### New Dependencies Required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `base64-arraybuffer` | ^1.0.2 | Base64 ↔ ArrayBuffer | Convert files for Supabase upload |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Storage | S3 direct | S3 requires separate auth; Supabase integrates with existing RLS |
| expo-document-picker | react-native-document-picker | expo version integrates better with Expo SDK |
| base64-arraybuffer | manual conversion | Library handles edge cases, well-tested |

**Installation:**
```bash
npm install base64-arraybuffer
# expo-file-system, expo-image-picker, expo-document-picker already in project
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/features/wallet/
├── components/          # Wallet UI components
├── hooks/               # usePersonalWallet, useGroupWallet
├── store.ts             # Zustand wallet store
├── types.ts             # Document, Wallet types
├── services/
│   └── storageService.ts    # Supabase Storage wrapper
└── adapters/
    └── normalizeDocument.ts  # Backend → frontend transforms
```

### Pattern 1: ArrayBuffer Upload for React Native
**What:** Convert file to base64, then ArrayBuffer for Supabase
**When to use:** All React Native file uploads to Supabase Storage
**Example:**
```typescript
// Source: Supabase Blog - React Native Storage
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

async function uploadDocument(uri: string, path: string) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { data, error } = await supabase.storage
    .from('wallet-documents')
    .upload(path, decode(base64), {
      contentType: 'application/pdf', // or image/jpeg, etc.
      upsert: false,
    });

  return { data, error };
}
```

### Pattern 2: Folder-Based Organization
**What:** Organize files by owner (user or trip)
**When to use:** All document storage
**Example:**
```
wallet-documents/
├── personal/
│   └── {user_id}/
│       ├── {document_id}.pdf
│       └── {document_id}.jpg
└── trips/
    └── {trip_id}/
        ├── {document_id}.pdf
        └── {document_id}.jpg
```

### Pattern 3: RLS with Security Definer for Group Access
**What:** Use security definer function to check trip membership without RLS recursion
**When to use:** Group wallet access policies
**Example:**
```sql
-- Source: Supabase discussions on team-based RLS
CREATE OR REPLACE FUNCTION get_user_trip_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trip_id FROM trip_members WHERE user_id = uid
$$;

-- Policy for group documents
CREATE POLICY "Users can access group documents for their trips"
ON wallet_documents FOR SELECT
USING (
  wallet_type = 'group' AND
  trip_id IN (SELECT get_user_trip_ids(auth.uid()))
);
```

### Anti-Patterns to Avoid
- **Using Blob directly in React Native:** Supabase upload fails; use ArrayBuffer
- **Storing files without user/trip prefix:** Makes RLS impossible, security risk
- **Checking trip membership in RLS without security definer:** Causes infinite recursion
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Base64 → ArrayBuffer | Manual conversion | `base64-arraybuffer` | Edge cases with padding, encoding |
| File MIME detection | Regex on filename | Expo's asset metadata | Unreliable, security risk |
| Image thumbnails | Sharp/canvas in RN | Supabase image transforms | Supabase has built-in transforms |
| File picker UI | Custom modal | expo-document-picker | Native UI, permissions handled |
| Storage signed URLs | Manual token generation | `supabase.storage.createSignedUrl()` | Built-in, handles expiry |

**Key insight:** Supabase Storage handles most file operations — don't re-implement upload, download, signed URLs, or transforms. Focus on the wallet business logic.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Using Blob/File in React Native
**What goes wrong:** Upload silently fails or sends corrupted data
**Why it happens:** React Native's fetch polyfill doesn't handle Blob like browsers
**How to avoid:** Always use ArrayBuffer via `base64-arraybuffer` decode
**Warning signs:** Files upload but download as corrupted, 0-byte files

### Pitfall 2: RLS Recursion on Membership Checks
**What goes wrong:** "infinite recursion detected in policy" error
**Why it happens:** RLS policy queries the same table it's protecting
**How to avoid:** Use `SECURITY DEFINER` function to bypass RLS for membership lookup
**Warning signs:** Queries hang or error on tables with membership-based RLS

### Pitfall 3: Missing Content-Type on Upload
**What goes wrong:** Files stored as `text/html` default, display incorrectly
**Why it happens:** Supabase defaults content-type if not specified
**How to avoid:** Always pass `contentType` option matching file type
**Warning signs:** PDFs open as HTML, images don't display

### Pitfall 4: Personal Documents Visible to Group
**What goes wrong:** Privacy breach — personal passport visible to trip members
**Why it happens:** RLS policies not properly separating personal vs group
**How to avoid:** Separate buckets or strict folder-based RLS; test with multiple users
**Warning signs:** User A can see User B's personal documents
</common_pitfalls>

<code_examples>
## Code Examples

### Document Type Definition
```typescript
// Source: Derived from NomadCrew Trip types + document wallet patterns
export type DocumentType =
  | 'passport'
  | 'visa'
  | 'insurance'
  | 'vaccination'
  | 'loyalty_card'
  | 'flight_booking'
  | 'hotel_booking'
  | 'reservation'
  | 'receipt'
  | 'other';

export type WalletType = 'personal' | 'group';

export interface WalletDocument {
  id: string;
  userId: string;
  walletType: WalletType;
  tripId?: string; // Required for group wallet
  documentType: DocumentType;
  name: string;
  description?: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  metadata?: {
    // For bookings
    departureTime?: string;
    arrivalTime?: string;
    confirmationNumber?: string;
    // For travel docs
    expiryDate?: string;
    documentNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Database Schema
```sql
-- Source: Supabase RLS patterns + NomadCrew trip structure
CREATE TABLE wallet_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('personal', 'group')),
  trip_id UUID REFERENCES trips(id), -- NULL for personal, required for group
  document_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: group wallet requires trip_id
  CONSTRAINT group_requires_trip CHECK (
    wallet_type = 'personal' OR trip_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE wallet_documents ENABLE ROW LEVEL SECURITY;

-- Personal wallet: only owner
CREATE POLICY "Users can manage their personal documents"
ON wallet_documents
FOR ALL
USING (wallet_type = 'personal' AND user_id = auth.uid())
WITH CHECK (wallet_type = 'personal' AND user_id = auth.uid());
```

### Supabase Storage Bucket Setup
```sql
-- Create bucket for wallet documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallet-documents', 'wallet-documents', false);

-- Personal documents: only owner can access
CREATE POLICY "Personal document access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'personal' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Group documents: trip members can access
CREATE POLICY "Group document access"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'trips' AND
  (storage.foldername(name))[2]::uuid IN (SELECT get_user_trip_ids(auth.uid()))
);
```

### Upload Service
```typescript
// Source: Supabase React Native blog + Context7 docs
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/api/supabase';

export async function uploadDocument(
  uri: string,
  documentId: string,
  walletType: 'personal' | 'group',
  userId: string,
  tripId?: string,
  mimeType: string = 'application/octet-stream'
) {
  // Determine storage path
  const path = walletType === 'personal'
    ? `personal/${userId}/${documentId}`
    : `trips/${tripId}/${documentId}`;

  // Read and convert file
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from('wallet-documents')
    .upload(path, decode(base64), {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FormData upload in RN | ArrayBuffer via base64 | 2023 | Required for Supabase RN uploads |
| Public buckets + client filtering | Private buckets + RLS | Standard | Security best practice |
| Direct S3 calls | Supabase Storage wrapper | With Supabase | Unified auth, simpler RLS |

**New tools/patterns to consider:**
- **Supabase Image Transforms:** Resize/optimize on-the-fly for thumbnails (available on Pro plan)
- **Resumable uploads:** For large files >6MB, use TUS protocol via Supabase

**Deprecated/outdated:**
- **Blob-based uploads in React Native:** Don't work reliably
- **Public storage buckets for user documents:** Security risk
</sota_updates>

<open_questions>
## Open Questions

1. **Offline document caching strategy**
   - What we know: expo-file-system can cache files locally
   - What's unclear: Best sync strategy when coming back online
   - Recommendation: Research in Phase 9 (Offline Sync), keep schema flexible

2. **Large file handling (>6MB)**
   - What we know: Standard upload limit is 6MB, resumable uploads available
   - What's unclear: Will travel documents exceed this? (unlikely for PDFs)
   - Recommendation: Start with standard uploads, add resumable if needed

3. **Trip membership table structure**
   - What we know: Existing `members` array in Trip type suggests backend has this
   - What's unclear: Exact backend schema for trip_members
   - Recommendation: Verify backend schema before creating RLS functions
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- /supabase/supabase-js - Storage upload, RLS patterns (Context7)
- /websites/supabase - RLS policies, storage access control (Context7)
- /llmstxt/expo_dev_llms_txt - expo-file-system, document picker (Context7)
- [Supabase Blog: React Native Storage](https://supabase.com/blog/react-native-storage) - ArrayBuffer pattern

### Secondary (MEDIUM confidence)
- [Supabase Discussion #6727](https://github.com/orgs/supabase/discussions/6727) - Security definer for team RLS
- [Supabase Discussion #4509](https://github.com/orgs/supabase/discussions/4509) - Team membership RLS patterns

### Tertiary (LOW confidence - needs validation)
- None - all patterns verified against official sources
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Supabase Storage + PostgreSQL RLS
- Ecosystem: expo-file-system, expo-image-picker, expo-document-picker
- Patterns: ArrayBuffer uploads, folder organization, RLS for groups
- Pitfalls: Blob in RN, RLS recursion, content-type, privacy leaks

**Confidence breakdown:**
- Standard stack: HIGH - Supabase already in project, patterns well-documented
- Architecture: HIGH - From official Supabase blog and Context7
- Pitfalls: HIGH - Documented in official sources and discussions
- Code examples: HIGH - Adapted from official sources, verified patterns

**Research date:** 2026-01-10
**Valid until:** 2026-02-10 (30 days - Supabase ecosystem stable)
</metadata>

---

*Phase: 01-foundation*
*Research completed: 2026-01-10*
*Ready for planning: yes*
