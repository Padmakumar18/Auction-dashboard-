-- Create storage buckets for player registration
-- Run this in your Supabase SQL Editor

-- Create players-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('players-photos', 'players-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create payment-proofs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for players-photos bucket
-- Allow public read access
CREATE POLICY "Public read access for players photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'players-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload players photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'players-photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update players photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'players-photos');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete players photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'players-photos');

-- Set up storage policies for payment-proofs bucket
-- Allow public read access
CREATE POLICY "Public read access for payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update payment proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete payment proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-proofs');

-- Add new columns to players table if they don't exist
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS location VARCHAR(50),
ADD COLUMN IF NOT EXISTS jersey_size VARCHAR(10),
ADD COLUMN IF NOT EXISTS jersey_number INTEGER,
ADD COLUMN IF NOT EXISTS payment_proof TEXT;

-- Add constraint for jersey number uniqueness
ALTER TABLE players 
ADD CONSTRAINT unique_jersey_number UNIQUE (jersey_number);

-- Add check constraint for jersey number range
ALTER TABLE players 
ADD CONSTRAINT check_jersey_number_range 
CHECK (jersey_number >= 1 AND jersey_number <= 99);
