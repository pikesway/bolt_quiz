-- Add slug column to quizzes table
ALTER TABLE quizzes
ADD COLUMN slug text UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX idx_quizzes_slug ON quizzes(slug);

-- Update policies to allow reading by slug
CREATE POLICY "Anyone can read published quizzes by slug"
  ON quizzes FOR SELECT
  TO anon
  USING (is_published = true AND slug IS NOT NULL);