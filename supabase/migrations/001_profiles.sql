-- Migration 001: profiles table, RLS, trigger
-- Run order: first migration

CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username        text UNIQUE NOT NULL,
  avatar_url      text,
  is_admin        boolean DEFAULT false,
  primeiro_acesso boolean DEFAULT true,
  senha_trocada   boolean DEFAULT false,
  pontos_especiais integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean AS $$
  SELECT coalesce((SELECT is_admin FROM profiles WHERE id = auth.uid()), false)
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Admin sees all profiles"
  ON profiles FOR SELECT USING (is_user_admin());

CREATE POLICY "Admin updates all profiles"
  ON profiles FOR UPDATE USING (is_user_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION admin_listar_usuarios()
RETURNS TABLE(
  id uuid, username text, email text, is_admin boolean,
  primeiro_acesso boolean, pontos bigint, palpites_count bigint, created_at timestamptz
) AS $$
BEGIN
  IF NOT is_user_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT p.id, p.username, u.email::text, p.is_admin, p.primeiro_acesso,
    coalesce((SELECT sum(pal.pontos) FROM palpites pal WHERE pal.user_id = p.id), 0)::bigint,
    coalesce((SELECT count(*) FROM palpites pal WHERE pal.user_id = p.id), 0)::bigint,
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY 6 DESC, p.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
