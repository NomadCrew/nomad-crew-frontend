-- Migration: 002_get_user_trip_ids.sql
-- Purpose: Security definer function for checking trip membership without RLS recursion
-- Phase: 01-foundation
-- Created: 2026-01-10

-- This function returns trip IDs where the user is a member.
-- SECURITY DEFINER allows it to bypass RLS, preventing infinite recursion
-- when used in RLS policies that need to check membership.

-- Note: Assumes trip_members table exists with (trip_id, user_id, role) structure.
-- If the backend uses a different membership pattern (e.g., embedded array in trips table),
-- this function may need adaptation.
--
-- Alternative patterns if trip_members doesn't exist:
-- Option A: Create a view from trips.members array
-- Option B: Query trips table directly if members is a JSONB column
-- Option C: Create trip_members table as part of this migration

CREATE OR REPLACE FUNCTION get_user_trip_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT trip_id
  FROM trip_members
  WHERE user_id = uid
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_trip_ids(UUID) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_user_trip_ids IS
  'Returns trip IDs where the user is a member. Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion when called from RLS policies.';

-- Fallback: If trip_members table doesn't exist but trips has embedded members,
-- uncomment and adapt this alternative:
--
-- CREATE OR REPLACE FUNCTION get_user_trip_ids(uid UUID)
-- RETURNS SETOF UUID
-- LANGUAGE sql
-- STABLE
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
--   SELECT id
--   FROM trips
--   WHERE members @> jsonb_build_array(jsonb_build_object('user_id', uid::text))
-- $$;
