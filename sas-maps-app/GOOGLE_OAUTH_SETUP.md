# Google OAuth Setup Guide for Supabase

## Prerequisites
- Supabase project created
- Google Cloud Console account

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `https://YOUR_SUPABASE_URL.supabase.co/auth/v1/callback?provider=google`
   - For local development: `http://localhost:3000/auth/v1/callback?provider=google`
7. Copy the **Client ID** and **Client Secret**

## Step 2: Enable Google Auth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Click on "Google"
5. Enable the provider
6. Paste your Google **Client ID** and **Client Secret**
7. Click "Save"

## Step 3: Verify Setup

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign up with Google"
4. A popup window should appear with Google's OAuth screen
5. After successful authentication, you'll be logged in

## Troubleshooting

**Error: "Unsupported provider: provider is not enabled"**
- Make sure Google provider is enabled in Supabase Authentication settings
- Check that Client ID and Client Secret are correctly entered
- Verify the redirect URI matches your environment

**Popup blocked by browser**
- Make sure the Google sign-in button click triggers the popup
- Check browser console for errors

**User not created after successful auth**
- Check that email verification is configured correctly
- Look at Supabase Auth logs for details

## Environment Variables

Ensure your `.env.local` includes:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

The Google OAuth Client ID and Secret are stored in Supabase, not in your environment variables.
