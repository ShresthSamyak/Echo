# 🔐 Login Setup Guide

## Quick Start

Your minimal login screen is ready! You just need to configure Supabase credentials.

---

## Step 1: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Click **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

---

## Step 2: Create `.env.local`

In the `frontend` folder, create a file named `.env.local`:

```bash
cd frontend
# Copy the example file
cp .env.example .env.local
```

Then edit `.env.local` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key-here
```

---

## Step 3: Enable Authentication Providers

### Enable Email (Magic Link)
1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle **Enable Email provider** to ON
4. ✅ Save

### Enable Google OAuth (Optional)
1. In **Authentication** → **Providers** → **Google**
2. Toggle **Enable Google provider** to ON
3. Add your Google OAuth credentials:
   - Get Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/)
   - Configure OAuth redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. ✅ Save

---

## Step 4: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   - `http://localhost:5173`
   - `http://localhost:5174`
3. ✅ Save

---

## Step 5: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Testing

1. **Visit** `http://localhost:5173` (or :5174)
2. You should be redirected to `/login`
3. **Email Login:**
   - Enter your email
   - Click "Continue with Email"
   - Check your inbox for magic link
   - Click link → You'll be logged in!
4. **Google Login:**
   - Click "Continue with Google"
   - Select Google account
   - Approve → You'll be logged in!

---

## Troubleshooting

### "Loading..." screen stuck
- Check browser console for errors
- Verify `.env.local` has correct credentials
- Make sure Supabase URL and key are valid

### Email not sending
- Check Supabase Dashboard → **Authentication** → **Email Templates**
- Verify Email provider is enabled
- Check spam folder

### Google OAuth not working
- Ensure redirect URI is configured in Google Cloud Console
- Verify Client ID and Secret in Supabase
- Check Supabase logs for OAuth errors

---

## What Happens After Login?

✅ User is redirected to marketplace (`/`)  
✅ User session persists across page refreshes  
✅ All product chats are linked to user's account  
✅ Conversation history saved to Supabase database

---

## Files Created

- `frontend/src/pages/LoginPage.jsx` - Login UI
- `frontend/src/services/auth.js` - Auth service
- `frontend/src/styles/login.css` - Styling
- `frontend/src/App.jsx` - Protected routing
- `frontend/.env.example` - Environment template

**Next:** Create `.env.local` and start testing! 🚀
