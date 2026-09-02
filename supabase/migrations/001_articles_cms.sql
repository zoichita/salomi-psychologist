-- Run in the Supabase SQL Editor. This migration creates the database,
-- role checks, RLS policies and public image bucket used by the static site.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('original','republished')),
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text not null,
  excerpt text not null check (char_length(excerpt) between 10 and 500),
  content text not null,
  author text,
  original_author text,
  source_name text,
  source_url text,
  cover_image_url text,
  published_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft','published')),
  constraint original_or_republished_fields check (
    (type = 'original' and author is not null and original_author is null and source_name is null and source_url is null)
    or
    (type = 'republished' and original_author is not null and source_name is not null and source_url ~ '^https?://')
  ),
  constraint published_date check (status = 'draft' or published_at is not null)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.articles enable row level security;

-- Explicit API grants keep access minimal when automatic table exposure is off.
grant select on public.profiles to authenticated;
grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

drop policy if exists "Profiles readable by owner or admin" on public.profiles;
create policy "Profiles readable by owner or admin" on public.profiles for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "Public reads published articles" on public.articles;
create policy "Public reads published articles" on public.articles for select
using (status = 'published' or public.is_admin());
drop policy if exists "Admins insert articles" on public.articles;
create policy "Admins insert articles" on public.articles for insert to authenticated
with check (public.is_admin());
drop policy if exists "Admins update articles" on public.articles;
create policy "Admins update articles" on public.articles for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete articles" on public.articles;
create policy "Admins delete articles" on public.articles for delete to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public reads article images" on storage.objects;
create policy "Public reads article images" on storage.objects for select
using (bucket_id = 'article-images');
drop policy if exists "Admins upload article images" on storage.objects;
create policy "Admins upload article images" on storage.objects for insert to authenticated
with check (bucket_id = 'article-images' and public.is_admin());
drop policy if exists "Admins update article images" on storage.objects;
create policy "Admins update article images" on storage.objects for update to authenticated
using (bucket_id = 'article-images' and public.is_admin()) with check (bucket_id = 'article-images' and public.is_admin());
drop policy if exists "Admins delete article images" on storage.objects;
create policy "Admins delete article images" on storage.objects for delete to authenticated
using (bucket_id = 'article-images' and public.is_admin());
