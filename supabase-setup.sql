-- Run this in your Supabase SQL editor to set up the videos table and storage.

-- 1. Create the videos table
create table if not exists videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  prompt text default '',
  model text default '',
  filename text not null,
  storage_path text not null,
  video_url text not null,
  duration_seconds double precision,
  created_at timestamptz default now()
);

-- Allow users to see only their own videos
alter table videos enable row level security;

create policy "Users can view own videos"
  on videos for select
  using (auth.uid() = user_id);

create policy "Users can insert own videos"
  on videos for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own videos"
  on videos for delete
  using (auth.uid() = user_id);

-- 2. Create the storage bucket for video files
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to the videos bucket
create policy "Users can upload videos"
  on storage.objects for insert
  with check (
    bucket_id = 'videos' and
    auth.role() = 'authenticated'
  );

create policy "Users can view videos"
  on storage.objects for select
  using (bucket_id = 'videos');

create policy "Users can delete own videos"
  on storage.objects for delete
  using (
    bucket_id = 'videos' and
    auth.uid() = owner
  );
