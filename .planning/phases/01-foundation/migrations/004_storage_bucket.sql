-- Migration: 004_storage_bucket.sql
-- Purpose: Create private storage bucket for wallet documents
-- Phase: 01-foundation
-- Created: 2026-01-10
-- Depends on: (none - storage is independent)

-- Create the wallet-documents bucket
-- Private bucket with file size and MIME type restrictions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wallet-documents',
  'wallet-documents',
  false,  -- Private bucket: all access through RLS
  10485760,  -- 10MB limit per file (sufficient for travel docs/photos)
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- BUCKET CONFIGURATION SUMMARY
-- ============================================
-- | Setting            | Value      | Reason                                    |
-- |--------------------|------------|-------------------------------------------|
-- | public             | false      | All access through signed URLs or RLS     |
-- | file_size_limit    | 10MB       | Sufficient for PDFs/photos, prevents abuse|
-- | allowed_mime_types | PDF, images| Travel docs are PDFs or scanned images    |
--
-- Folder structure:
--   wallet-documents/
--   ├── personal/{user_id}/{document_id}.{ext}
--   └── trips/{trip_id}/{document_id}.{ext}
--
-- Note: ON CONFLICT allows this migration to be re-run safely
