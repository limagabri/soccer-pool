-- Migration 005: invite system

CREATE TABLE IF NOT EXISTS convites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  nome       text NOT NULL,
  token      text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  usado      boolean DEFAULT false,
  criado_por uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days'
);

ALTER TABLE convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages invites"
  ON convites FOR ALL USING (is_user_admin());

CREATE POLICY "Invite readable by token"
  ON convites FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION marcar_convite_usado(p_token text, p_email text)
RETURNS boolean AS $$
BEGIN
  UPDATE convites SET usado = true
  WHERE token = p_token AND email = p_email AND usado = false AND expires_at > now();
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
