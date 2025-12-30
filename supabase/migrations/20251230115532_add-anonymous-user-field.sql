-- Add isAnonymous field to Better Auth user table for anonymous authentication
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isAnonymous" boolean DEFAULT false;

-- Index for querying anonymous users (useful for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_user_is_anonymous ON "user"("isAnonymous");
