/*
  # Create phone numbers table

  1. New Tables
    - `phone_numbers`
      - `id` (uuid, primary key) - Unique identifier for each record
      - `phone` (text, unique, not null) - Phone number (exactly 10 digits)
      - `created_at` (timestamptz) - Timestamp when the record was created
  
  2. Security
    - Enable RLS on `phone_numbers` table
    - Add policy for anyone to read phone numbers (public access)
    - Add policy for anyone to insert phone numbers (public access)
    - Add policy for anyone to update phone numbers (public access)
    - Add policy for anyone to delete phone numbers (public access)
  
  3. Constraints
    - Phone number must be exactly 10 digits
    - Phone number must be unique
*/

CREATE TABLE IF NOT EXISTS phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read phone numbers"
  ON phone_numbers
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert phone numbers"
  ON phone_numbers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update phone numbers"
  ON phone_numbers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete phone numbers"
  ON phone_numbers
  FOR DELETE
  USING (true);