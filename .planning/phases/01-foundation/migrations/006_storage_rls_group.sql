-- Migration: 006_storage_rls_group.sql
-- Purpose: RLS policies for group document storage access
-- Phase: 01-foundation
-- Created: 2026-01-10
-- Depends on: 002_get_user_trip_ids.sql, 004_storage_bucket.sql

-- ============================================
-- GROUP DOCUMENTS STORAGE POLICIES
-- ============================================
-- Path format: trips/{trip_id}/{filename}
-- Access: Any member of the trip can view, upload, update, or delete
--
-- Uses get_user_trip_ids() security definer function to check membership
-- without RLS recursion (created in 002_get_user_trip_ids.sql)

-- SELECT policy - trip members can view group files
CREATE POLICY "Trip members can view group documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'trips' AND
  (storage.foldername(name))[2]::uuid IN (SELECT get_user_trip_ids(auth.uid()))
);

-- INSERT policy - trip members can upload group files
CREATE POLICY "Trip members can upload group documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'trips' AND
  (storage.foldername(name))[2]::uuid IN (SELECT get_user_trip_ids(auth.uid()))
);

-- UPDATE policy - trip members can update group files
-- Note: Uses collaborative model where any trip member can update any group file
-- Rationale: Simpler, matches "shared folder" mental model, can tighten later
CREATE POLICY "Trip members can update group documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'trips' AND
  (storage.foldername(name))[2]::uuid IN (SELECT get_user_trip_ids(auth.uid()))
)
WITH CHECK (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'trips' AND
  (storage.foldername(name))[2]::uuid IN (SELECT get_user_trip_ids(auth.uid()))
);

-- DELETE policy - trip members can delete group files
-- Note: Uses collaborative model where any trip member can delete any group file
-- Rationale: Simpler, matches "shared folder" mental model, can tighten later
CREATE POLICY "Trip members can delete group documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wallet-documents' AND
  (storage.foldername(name))[1] = 'trips' AND
  (storage.foldername(name))[2]::uuid IN (SELECT get_user_trip_ids(auth.uid()))
);

-- ============================================
-- POLICY SUMMARY
-- ============================================
-- | Operation | Who Can Do It    | Path Pattern              |
-- |-----------|------------------|---------------------------|
-- | SELECT    | Trip members     | trips/{trip_id}/{file}    |
-- | INSERT    | Trip members     | trips/{trip_id}/{file}    |
-- | UPDATE    | Trip members     | trips/{trip_id}/{file}    |
-- | DELETE    | Trip members     | trips/{trip_id}/{file}    |
--
-- Key points:
-- 1. Collaborative model: all trip members have equal access
-- 2. Membership checked via get_user_trip_ids() security definer
-- 3. Path segment cast to UUID for proper comparison
-- 4. Non-members cannot access any group files
-- 5. Removing user from trip revokes their storage access
--
-- Design decision: Collaborative vs Owner-only
-- Chose collaborative for v1 because:
-- - Simpler to implement
-- - Matches "shared folder" mental model
-- - Document metadata table (wallet_documents) tracks ownership for audit
-- - Can add stricter controls later if needed
