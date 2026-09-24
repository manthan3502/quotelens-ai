create extension if not exists pgcrypto;

create type public.comparison_status as enum (
  'draft',
  'extracting',
  'review',
  'completed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  status public.comparison_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  original_filename text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'extracting', 'completed', 'failed')),
  extracted_json jsonb,
  verified_json jsonb,
  vendor_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comparisons_user_id_created_at_idx
  on public.comparisons(user_id, created_at desc);
create index quotations_comparison_id_idx
  on public.quotations(comparison_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger comparisons_set_updated_at
before update on public.comparisons
for each row execute procedure public.set_updated_at();

create trigger quotations_set_updated_at
before update on public.quotations
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.comparisons enable row level security;
alter table public.quotations enable row level security;

create policy "Users can read their profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their comparisons"
on public.comparisons for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their comparisons"
on public.comparisons for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their comparisons"
on public.comparisons for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their comparisons"
on public.comparisons for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read quotations in their comparisons"
on public.quotations for select to authenticated
using (
  exists (
    select 1 from public.comparisons
    where comparisons.id = quotations.comparison_id
      and comparisons.user_id = (select auth.uid())
  )
);

create policy "Users can create quotations in their comparisons"
on public.quotations for insert to authenticated
with check (
  exists (
    select 1 from public.comparisons
    where comparisons.id = quotations.comparison_id
      and comparisons.user_id = (select auth.uid())
  )
);

create policy "Users can update quotations in their comparisons"
on public.quotations for update to authenticated
using (
  exists (
    select 1 from public.comparisons
    where comparisons.id = quotations.comparison_id
      and comparisons.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.comparisons
    where comparisons.id = quotations.comparison_id
      and comparisons.user_id = (select auth.uid())
  )
);

create policy "Users can delete quotations in their comparisons"
on public.quotations for delete to authenticated
using (
  exists (
    select 1 from public.comparisons
    where comparisons.id = quotations.comparison_id
      and comparisons.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quotations',
  'quotations',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their quotation files"
on storage.objects for select to authenticated
using (bucket_id = 'quotations' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload their quotation files"
on storage.objects for insert to authenticated
with check (bucket_id = 'quotations' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can update their quotation files"
on storage.objects for update to authenticated
using (bucket_id = 'quotations' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'quotations' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their quotation files"
on storage.objects for delete to authenticated
using (bucket_id = 'quotations' and (storage.foldername(name))[1] = (select auth.uid())::text);
