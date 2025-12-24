-- Enable Row Level Security on thread_colours table
ALTER TABLE thread_colours ENABLE ROW LEVEL SECURITY;

-- Allow public read access (catalog data is public)
CREATE POLICY "Allow public read access"
  ON thread_colours
  FOR SELECT
  USING (true);
