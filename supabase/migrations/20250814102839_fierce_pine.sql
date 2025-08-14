/*
  # Fix User Signup Database Error

  1. Changes
    - Update handle_new_user function to handle email conflicts
    - Use ON CONFLICT clause to update existing profiles instead of failing
    - Ensure resilient profile creation for new users

  2. Security
    - Maintains existing RLS policies
    - No changes to authentication flow
*/

-- Function to handle user profile creation with conflict resolution
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (email) 
  DO UPDATE SET 
    id = new.id,
    full_name = new.raw_user_meta_data->>'full_name',
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;