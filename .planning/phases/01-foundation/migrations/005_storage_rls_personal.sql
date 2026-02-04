-- Migration: 005_storage_rls_personal.sql
-- Purpose: RLS policies for personal document storage access
-- Phase: 01-foundation
-- Created: 2026-01-10
-- Depends on: 004_storage_bucket.sql

-- ============================================
-- PERSONAL DOCUMENTS STORAGE POLICIES
-- ============================================
-- Path format: personal/{user_id}/{filename}
-- Access: Only the owning user can view, upload, update, or delete
--
-- Uses storage.foldername() helper function:
--   storage.foldername('personal/abc-123/doc.pdf')
--   returns ARRAY['personal', 'abc-123']

-- SELECT policy - view/download personal files
CREATE POLICY "Users can view their personal documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'personal' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- INSERT policy - upload personal files
CREATE POLICY "Users can upload personal documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'personal' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- UPDATE policy - update personal files (replace)
CREATE POLICY "Users can update their personal documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'personal' AND
  (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'personal' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- DELETE policy - remove personal files
CREATE POLICY "Users can delete their personal documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'personal' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- POLICY SUMMARY
-- ============================================
-- | Operation | Who Can Do It | Path Pattern                    |
-- |-----------|---------------|-------------------------------- |
-- | SELECT    | Owner only    | personal/{auth.uid()}/{file}    |
-- | INSERT    | Owner only    | personal/{auth.uid()}/{file}    |
-- | UPDATE    | Owner only    | personal/{auth.uid()}/{file}    |
-- | DELETE    | Owner only    | personal/{auth.uid()}/{file}    |
--
-- Key points:
-- 1. User can only access files in their own folder
-- 2. Path must start with 'personal' and contain user's UUID
-- 3. No cross-user access is possible
-- 4. Enforced at storage layer, independent of database RLS
