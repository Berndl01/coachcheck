-- Supabase-Stub-Harness für lokale Migrationsverifikation
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select from pg_roles where rolname='authenticator') then create role authenticator noinherit login password 'x'; end if;
end $$;
grant anon, authenticated, service_role to authenticator;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text, raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now()
);
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('test.uid', true), '')::uuid $fn$;
create or replace function auth.role() returns text language sql stable as $fn$
  select coalesce(nullif(current_setting('test.role', true), ''), 'authenticated') $fn$;
create or replace function auth.jwt() returns jsonb language sql stable as $fn$ select '{}'::jsonb $fn$;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean default false, created_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, created_at timestamptz default now(), metadata jsonb default '{}'::jsonb
);
create or replace function storage.foldername(name text) returns text[] language sql immutable as $fn$
  select string_to_array(name, '/') $fn$;
alter table storage.objects enable row level security;
