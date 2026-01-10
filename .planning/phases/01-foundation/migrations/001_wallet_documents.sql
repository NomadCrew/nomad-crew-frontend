-- Migration: 001_wallet_documents.sql
-- Purpose: Create wallet_documents table for personal and group document storage
-- Phase: 01-foundation
-- Created: 2026-01-10

-- Create document_type enum for type safety
CREATE TYPE document_type AS ENUM (
  'passport',
  'visa',
  'insurance',
  'vaccination',
  'loyalty_card',
  'flight_booking',
  'hotel_booking',
  'reservation',
  'receipt',
  'other'
);

-- Create wallet_type enum
CREATE TYPE wallet_type AS ENUM ('personal', 'group');

-- Create wallet_documents table
CREATE TABLE wallet_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type wallet_type NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Group wallet requires trip_id
  CONSTRAINT group_requires_trip CHECK (
    wallet_type = 'personal' OR trip_id IS NOT NULL
  ),

  -- Personal wallet must not have trip_id
  CONSTRAINT personal_no_trip CHECK (
    wallet_type = 'group' OR trip_id IS NULL
  )
);

-- Indexes for common queries
CREATE INDEX idx_wallet_docs_user_id ON wallet_documents(user_id);
CREATE INDEX idx_wallet_docs_trip_id ON wallet_documents(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_wallet_docs_wallet_type ON wallet_documents(wallet_type);
CREATE INDEX idx_wallet_docs_document_type ON wallet_documents(document_type);
CREATE INDEX idx_wallet_docs_created_at ON wallet_documents(created_at DESC);

-- Composite index for personal wallet queries
CREATE INDEX idx_wallet_docs_personal ON wallet_documents(user_id, wallet_type)
  WHERE wallet_type = 'personal';

-- Composite index for group wallet queries
CREATE INDEX idx_wallet_docs_group ON wallet_documents(trip_id, wallet_type)
  WHERE wallet_type = 'group';

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_wallet_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to table
CREATE TRIGGER wallet_documents_updated_at
  BEFORE UPDATE ON wallet_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_documents_updated_at();

-- Enable Row Level Security
ALTER TABLE wallet_documents ENABLE ROW LEVEL SECURITY;

-- Comment for documentation
COMMENT ON TABLE wallet_documents IS 'Stores personal and group travel documents for the wallet feature';
COMMENT ON COLUMN wallet_documents.wallet_type IS 'personal = private to user, group = shared with trip members';
COMMENT ON COLUMN wallet_documents.trip_id IS 'Required for group wallet, NULL for personal';
COMMENT ON COLUMN wallet_documents.storage_path IS 'Path in Supabase Storage: personal/{user_id}/{id} or trips/{trip_id}/{id}';
COMMENT ON COLUMN wallet_documents.metadata IS 'JSON metadata varying by document_type (expiry dates, confirmation numbers, etc.)';
