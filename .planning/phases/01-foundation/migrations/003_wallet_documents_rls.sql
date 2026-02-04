-- Migration: 003_wallet_documents_rls.sql
-- Purpose: RLS policies for wallet_documents table
-- Phase: 01-foundation
-- Created: 2026-01-10
-- Depends on: 001_wallet_documents.sql, 002_get_user_trip_ids.sql

-- ============================================
-- PERSONAL WALLET POLICIES
-- ============================================
-- Personal documents are completely private to the owner.
-- No other user can see, create, update, or delete them.

CREATE POLICY "Users can manage their personal documents"
ON wallet_documents
FOR ALL
USING (
  wallet_type = 'personal' AND
  user_id = auth.uid()
)
WITH CHECK (
  wallet_type = 'personal' AND
  user_id = auth.uid()
);

-- ============================================
-- GROUP WALLET POLICIES
-- ============================================
-- Group documents are shared among trip members.
-- All members can view, but only the document owner can modify/delete.

-- Policy: Trip members can view group documents
CREATE POLICY "Trip members can view group documents"
ON wallet_documents
FOR SELECT
USING (
  wallet_type = 'group' AND
  trip_id IN (SELECT get_user_trip_ids(auth.uid()))
);

-- Policy: Trip members can upload group documents
-- The uploader becomes the document owner (user_id = auth.uid())
CREATE POLICY "Trip members can upload group documents"
ON wallet_documents
FOR INSERT
WITH CHECK (
  wallet_type = 'group' AND
  trip_id IN (SELECT get_user_trip_ids(auth.uid())) AND
  user_id = auth.uid()
);

-- Policy: Only document owner can update group documents
-- Must still be a trip member (in case they were removed)
CREATE POLICY "Document owners can update group documents"
ON wallet_documents
FOR UPDATE
USING (
  wallet_type = 'group' AND
  user_id = auth.uid() AND
  trip_id IN (SELECT get_user_trip_ids(auth.uid()))
)
WITH CHECK (
  wallet_type = 'group' AND
  user_id = auth.uid() AND
  trip_id IN (SELECT get_user_trip_ids(auth.uid()))
);

-- Policy: Only document owner can delete group documents
-- Must still be a trip member (in case they were removed)
CREATE POLICY "Document owners can delete group documents"
ON wallet_documents
FOR DELETE
USING (
  wallet_type = 'group' AND
  user_id = auth.uid() AND
  trip_id IN (SELECT get_user_trip_ids(auth.uid()))
);

-- ============================================
-- POLICY SUMMARY
-- ============================================
-- | Wallet Type | Operation | Who Can Do It           |
-- |-------------|-----------|-------------------------|
-- | Personal    | ALL       | Owner only              |
-- | Group       | SELECT    | All trip members        |
-- | Group       | INSERT    | Trip members (→ owner)  |
-- | Group       | UPDATE    | Document owner + member |
-- | Group       | DELETE    | Document owner + member |
--
-- Key points:
-- 1. Personal documents are completely isolated
-- 2. Group documents are viewable by all trip members
-- 3. Only the uploader (owner) can modify/delete group documents
-- 4. Removing a user from a trip revokes their group access
-- 5. Uses get_user_trip_ids() to avoid RLS recursion
