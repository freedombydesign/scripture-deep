# Scripture Deep - Setup Guide

Follow these steps to get Scripture Deep running.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **New Project**
3. Name it `scripture-deep`
4. Set a strong database password (save it somewhere safe)
5. Choose the region closest to you
6. Click **Create new project** and wait for it to initialize

## 2. Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Under Email settings:
   - Enable **Confirm email** (for magic links)
   - Disable **Secure email change** for simplicity
4. Go to **Authentication** → **URL Configuration**
5. Set **Site URL** to `http://localhost:3000` (for development)
6. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

## 3. Run the Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the editor
5. Click **Run** (or press Cmd+Enter)
6. You should see "Success. No rows returned"

## 4. Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public** key (the long string under "Project API keys")

## 5. Configure Environment Variables

1. In your project folder, copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

## 6. Make Yourself a Teacher

After signing up for the first time:

1. Go to Supabase **Table Editor** → **users**
2. Find your row (by email)
3. Change `role` from `student` to `teacher`
4. Click **Save**

## 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 8. Import KJV Verses (Required for Verse Popovers)

Run the import script to load KJV text into the database:

```bash
npm run import-kjv
```

This takes about 30 seconds and loads ~31,000 verses.

---

## Deploying to Vercel

When you're ready to deploy:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add the same environment variables in Vercel's project settings
4. Update **Site URL** and **Redirect URLs** in Supabase to your Vercel domain
5. Deploy!
