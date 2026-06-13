-- Migration 012: Allow authenticated users to read all profiles
-- Needed so the Ranking page can fetch usernames for all participants.
-- Without this, "Users see own profile" restricts each user to only their
-- own row, making the ranking show only the logged-in user.

CREATE POLICY "Profiles visible to authenticated users"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
