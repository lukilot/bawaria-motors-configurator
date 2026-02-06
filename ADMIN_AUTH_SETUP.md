# Admin Panel Authentication Setup

## Overview
The admin panel is now protected with password authentication. Only users with the correct password can access `/admin`.

## Setup Instructions

### 1. Set Admin Password

Add the following to your `.env.local` file (for local development):
```env
ADMIN_PASSWORD=your_secure_password_here
```

**Important:** Choose a strong password with:
- At least 12 characters
- Mix of uppercase and lowercase letters
- Numbers and special characters
- Example: `Baw@ria2026!SecureAdmin`

### 2. For Production Deployment

When deploying to Vercel, Netlify, or other platforms:

1. Go to your project settings
2. Find "Environment Variables" section
3. Add a new variable:
   - **Name:** `ADMIN_PASSWORD`
   - **Value:** Your secure password
4. Redeploy your application

**Never commit your password to Git!** The `.env.local` file is already in `.gitignore`.

## How It Works

### Login Flow
1. User visits `/admin`
2. Login screen appears
3. User enters password
4. Password is verified against `ADMIN_PASSWORD` environment variable
5. On success, session is stored in browser's sessionStorage
6. User can access admin panel

### Session Management
- Session is stored in browser's sessionStorage
- Session persists until:
  - User clicks "Wyloguj" (Logout) button
  - User closes the browser tab
  - User clears browser data

### Security Features
- ✅ Password stored only in environment variables (server-side)
- ✅ Password verification happens server-side via API route
- ✅ Session stored in sessionStorage (cleared on tab close)
- ✅ Logout button in bottom-right corner
- ✅ Password visibility toggle
- ✅ Error messages in Polish

## Testing Locally

1. Add password to `.env.local`:
   ```env
   ADMIN_PASSWORD=test123
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

3. Visit http://localhost:3000/admin

4. Enter your password and click "Zaloguj się"

## Troubleshooting

### "Server configuration error"
- Make sure `ADMIN_PASSWORD` is set in your environment variables
- Restart your dev server after adding the variable

### Password not working
- Check for typos in `.env.local`
- Make sure there are no extra spaces
- Verify the file is named exactly `.env.local`

### Session not persisting
- This is normal - sessionStorage clears when you close the tab
- For longer sessions, you would need to implement cookie-based auth

## Upgrading to Full Authentication (Future)

This simple password protection is suitable for:
- Internal use
- Single admin user
- Quick deployment

For production with multiple users, consider upgrading to:
- Supabase Authentication (recommended)
- NextAuth.js
- Auth0

The current implementation can be easily replaced without affecting the rest of the admin panel.

## Files Modified

- `src/components/admin/AdminAuth.tsx` - Authentication component
- `src/app/api/admin/auth/route.ts` - Password verification API
- `src/app/admin/page.tsx` - Wrapped with AdminAuth
