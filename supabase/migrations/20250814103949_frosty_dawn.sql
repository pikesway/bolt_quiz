/*
  # Remove problematic user trigger

  1. Changes
    - Drop the handle_new_user trigger that's causing signup failures
    - Drop the handle_new_user function
    - Simplify RLS policies on profiles table
    - Allow users to create their own profiles after signup

  2. Security
    - Keep RLS enabled on profiles table
    - Allow authenticated users to insert their own profile
    - Allow users to read and update their own profile data
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update RLS policies on profiles table to be more permissive for user creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new, simpler policies
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);