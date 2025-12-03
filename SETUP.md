# SafeTube Setup Guide

This guide will walk you through setting up the SafeTube application.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- A Google Cloud account for YouTube API

## Step 1: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 2: Set up Supabase

### 2.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `safetube`
   - **Database Password**: Generate and save securely
   - **Region**: Choose closest to you
4. Click **"Create new project"** and wait ~2 minutes

### 2.2 Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the SQL from below
4. Click **"Run"**

```sql
-- Create parents table (extends Supabase auth.users)
create table parents (
  id uuid references auth.users primary key,
  email text not null unique,
  created_at timestamp with time zone default now()
);

-- Create videos table
create table videos (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade,
  youtube_id text not null,
  title text,
  thumbnail_url text,
  duration_seconds integer,
  made_for_kids boolean default true,
  watch_count integer default 0,
  last_watched_at timestamp with time zone,
  created_at timestamp with time zone default now(),

  unique(parent_id, youtube_id)
);

-- Enable Row Level Security
alter table parents enable row level security;
alter table videos enable row level security;

-- Parents can only see/manage their own data
create policy "Parents can view own data" on parents
  for select using (auth.uid() = id);

create policy "Parents can update own data" on parents
  for update using (auth.uid() = id);

-- Parents can manage their own videos
create policy "Parents manage own videos" on videos
  for all using (auth.uid() = parent_id);

-- Public read access for child feed (filtered by parent_id in app)
create policy "Public read for child feed" on videos
  for select using (true);

-- Create indexes for performance
create index videos_parent_id_idx on videos(parent_id);
create index videos_watch_count_idx on videos(watch_count);
create index videos_youtube_id_idx on videos(youtube_id);

-- Function to auto-create parent record on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.parents (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create parent record when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 2.3 Configure Authentication

1. Go to **Authentication** > **Providers**
2. Ensure **Email** provider is enabled
3. Go to **Authentication** > **URL Configuration**
   - Set **Site URL** to `http://localhost:3000`
   - Add redirect URL: `http://localhost:3000/admin`

### 2.4 Get API Credentials

1. Go to **Project Settings** (gear icon) > **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep secret!)

## Step 3: Set up YouTube Data API

### 3.1 Create Google Cloud Project

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Create a new project or select existing one

### 3.2 Enable YouTube Data API v3

1. Go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click **Enable**

### 3.3 Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key
4. (Recommended) Click **Restrict Key**:
   - **API restrictions**: Select "Restrict key"
   - Choose "YouTube Data API v3"
   - Save

## Step 4: Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...

# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSyxxxxx...
```

## Step 5: Run the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test the Setup

1. Visit [http://localhost:3000/admin/signup](http://localhost:3000/admin/signup)
2. Create a parent account
3. Check your email for verification (if enabled in Supabase)
4. You should be redirected to the admin dashboard

## Troubleshooting

### "Invalid API key" error
- Verify your YouTube API key in `.env.local`
- Ensure YouTube Data API v3 is enabled in Google Cloud Console
- Check API key restrictions

### "Failed to fetch" or CORS errors
- Verify Supabase URL and keys in `.env.local`
- Check that your Supabase project is active
- Ensure redirect URLs are configured correctly

### Authentication not working
- Check that email provider is enabled in Supabase
- Verify middleware.ts is running (check console logs)
- Clear browser cookies and try again

### Database errors
- Verify all SQL migrations ran successfully
- Check Row Level Security policies are enabled
- Ensure the trigger function was created

## Next Steps

Once setup is complete, you can proceed with Phase 2 of development:
- Build authentication pages
- Create admin dashboard
- Implement video management

See `safetube-prd.md` for the complete implementation plan.
