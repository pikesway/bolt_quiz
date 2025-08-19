/*
  # Create Quiz Platform Database Schema

  1. New Tables
    - `profiles` - User profiles and authentication data
    - `quizzes` - Main quiz information with cover images
    - `questions` - Quiz questions with optional images
    - `answers` - Answer options for questions
    - `personality_types` - Personality type definitions with result images
    - `quiz_responses` - User responses to quizzes
    - `quiz_results` - Calculated quiz results for users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for published quizzes

  3. Storage
    - Create storage buckets for quiz images
    - Set up policies for image uploads
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  cover_image_url text,
  is_published boolean DEFAULT false,
  total_takes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create personality_types table
CREATE TABLE IF NOT EXISTS personality_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  color text NOT NULL DEFAULT '#8B5CF6',
  icon text DEFAULT 'Star',
  result_image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  image_url text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  personality_type_id uuid REFERENCES personality_types(id) ON DELETE CASCADE NOT NULL,
  weight integer DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  personality_type_id uuid REFERENCES personality_types(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users and service role"
  ON profiles FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

-- Quizzes policies
CREATE POLICY "Users can read own quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read published quizzes"
  ON quizzes FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Users can create quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Personality types policies
CREATE POLICY "Users can manage personality types for own quizzes"
  ON personality_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = personality_types.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read personality types for published quizzes"
  ON personality_types FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = personality_types.quiz_id 
      AND quizzes.is_published = true
    )
  );

-- Questions policies
CREATE POLICY "Users can manage questions for own quizzes"
  ON questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read questions for published quizzes"
  ON questions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.is_published = true
    )
  );

-- Answers policies
CREATE POLICY "Users can manage answers for own quiz questions"
  ON answers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = answers.question_id 
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read answers for published quiz questions"
  ON answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = answers.question_id 
      AND quizzes.is_published = true
    )
  );

-- Quiz responses policies
CREATE POLICY "Users can create quiz responses"
  ON quiz_responses FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can read own quiz responses"
  ON quiz_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Quiz owners can read responses to their quizzes"
  ON quiz_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_responses.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

-- Quiz results policies
CREATE POLICY "Users can create quiz results"
  ON quiz_results FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can read own quiz results"
  ON quiz_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Quiz owners can read results for their quizzes"
  ON quiz_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_results.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('quiz-images', 'quiz-images', true);

-- Set up storage policies
CREATE POLICY "Anyone can view quiz images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'quiz-images');

CREATE POLICY "Authenticated users can upload quiz images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'quiz-images');

CREATE POLICY "Users can update own quiz images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'quiz-images');

CREATE POLICY "Users can delete own quiz images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'quiz-images');

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();