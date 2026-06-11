# GroupCal Setup Guide

## 1. Supabase setup

### Create the database

1. Go to [supabase.com](https://supabase.com) and open your project
2. In the left sidebar, click **SQL Editor**
3. Click **New query**
4. Open `supabase-schema.sql` in this folder, copy the entire contents, paste it, and click **Run**

### Get your credentials

1. Go to **Project Settings → API** (gear icon in sidebar)
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Configure email auth redirect

1. Go to **Authentication → URL Configuration**
2. Under **Redirect URLs**, add: `groupcal://auth-callback`
3. Click **Save**

---

## 2. App setup

### Create your .env file

In the `GroupCal` folder, create a file called `.env` with:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with what you copied from Supabase.

---

## 3. Run the app

Open a terminal in the `GroupCal` folder and run:

```bash
npx expo start
```

This will show a QR code.

### On your iPhone
- Open the **Expo Go** app (install from App Store if you haven't)
- Scan the QR code
- The app will load on your phone

### On your browser
- Press **W** in the terminal to open the web version

### On Android
- Scan the QR code with the Expo Go app (from Google Play)

---

## 4. First use

1. Enter your email and tap **Send magic link**
2. Open the email on your phone and tap the link
3. The app opens automatically — tap **Create group**
4. Give your group a name
5. Go to **Settings ⚙️** and tap **Share invite link** to invite friends

---

## Troubleshooting

**Magic link doesn't open the app**
- Make sure you're clicking the link on the same device running Expo Go
- In the Supabase dashboard → Authentication → URL Configuration, confirm `groupcal://auth-callback` is listed as a redirect URL

**"Could not create group" error**
- Check that you ran the full `supabase-schema.sql` without errors
- Check that your `.env` values are correct (no extra spaces)

**App shows blank screen**
- Check the terminal for errors
- Make sure `.env` exists with both values filled in
