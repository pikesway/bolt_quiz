-- Drop existing column and policy if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'slug') THEN
        ALTER TABLE quizzes DROP COLUMN slug;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read published quizzes by slug') THEN
        DROP POLICY IF EXISTS "Anyone can read published quizzes by slug" ON quizzes;
    END IF;
END $$;

-- Add slug column to quizzes table with NOT NULL constraint
ALTER TABLE quizzes
ADD COLUMN slug text;

-- Create unique index for faster slug lookups
DROP INDEX IF EXISTS idx_quizzes_slug;
CREATE UNIQUE INDEX idx_quizzes_slug ON quizzes(slug) WHERE slug IS NOT NULL;

-- Update policies to allow reading by slug
CREATE POLICY "Anyone can read published quizzes by slug"
  ON quizzes FOR SELECT
  TO anon
  USING (is_published = true AND slug IS NOT NULL);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';