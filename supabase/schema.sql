-- =============================================================
-- BolãoCopa — Schema inicial
-- Execute este script no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kpkwmizxvvjdlpaczese/sql
-- =============================================================

-- Tabela de perfis (vinculada ao auth.users)
create table if not exists public.profiles (
  id uuid references auth.users (id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Habilita Row Level Security
alter table public.profiles enable row level security;

-- Policies: usuário só vê e edita o próprio perfil
create policy "Usuários veem o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários inserem o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Usuários editam o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger: cria o perfil automaticamente após o cadastro,
-- usando o username enviado em options.data no signUp
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
