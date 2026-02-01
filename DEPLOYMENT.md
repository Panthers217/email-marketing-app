# Deployment Guide

This guide covers deploying the Email Marketing App with the backend on Render and the frontend on Netlify.

## Prerequisites

1. GitHub account with your repository pushed
2. Render account (https://render.com)
3. Netlify account (https://netlify.com)
4. MongoDB Atlas database (already configured)
5. Resend API key
6. **Firebase project with Authentication enabled**
7. Firebase Admin SDK credentials (service account)
8. Firebase Web App configuration

## Backend Deployment (Render)

### Step 1: Create Web Service on Render

1. Go to https://render.com and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `email-marketing-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave blank (render.yaml handles this)
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free (or upgrade as needed)

### Step 2: Set Environment Variables on Render

Add these environment variables in Render Dashboard → Environment:

```
NODE_ENV=production
PORT=3001
APP_SECRET_KEY=<generate-32-byte-hex-string>
WORKSPACE_PASSWORD=<your-secure-password>
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=<your-verified-sender-email>
MONGODB_URI=<your-mongodb-connection-string>
CLIENT_URL=<your-netlify-url>
```

**Firebase Admin SDK Variables (Required):**
```
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
FIREBASE_PRIVATE_KEY=<your-private-key-with-escaped-newlines>
```

**Important Notes:**
- Generate new secure key for `APP_SECRET_KEY` using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Get Firebase credentials from Firebase Console → Project Settings → Service Accounts → Generate new private key
- For `FIREBASE_PRIVATE_KEY`, keep the quotes and `\n` escape sequences (e.g., `"-----BEGIN PRIVATE KEY-----\nYourKey\n-----END PRIVATE KEY-----\n"`)
- `CLIENT_URL` will be your Netlify URL (e.g., `https://your-app.netlify.app`)

### Step 3: Deploy Backend

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Note your backend URL (e.g., `https://email-marketing-backend.onrender.com`)
4. Test the health endpoint: `https://your-backend-url.onrender.com/api/health`

## Frontend Deployment (Netlify)

### Step 1: Update Backend URL

Before deploying to Netlify, update `netlify.toml`:

1. Open `netlify.toml`
2. Replace `https://your-backend-url.onrender.com` with your actual Render URL
3. Commit and push changes

### Step 2: Create Site on Netlify

1. Go to https://netlify.com and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `client/dist`
   - **Branch**: `main` (or your default branch)

### Step 3: Configure Environment Variables

**Required:** Add Firebase Web App configuration variables:

1. Go to Site settings → Environment variables
2. Add these variables (get from Firebase Console → Project Settings → Your apps):

```
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

**Note:** These are safe to expose publicly (they're for client-side Firebase SDK)

### Step 4: Deploy Frontend

1. Click "Deploy site"
2. Netlify will build and deploy automatically
3. Note your site URL (e.g., `https://your-app.netlify.app`)

### Step 5: Update Backend CORS

Go back to Render and update the `CLIENT_URL` environment variable:
```
CLIENT_URL=https://your-app.netlify.app
```

Then redeploy the backend service.

## Post-Deployment Steps

### 1. Update API Proxy in netlify.toml

Open `netlify.toml` and ensure the API redirect points to your Render backend:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-actual-backend-url.onrender.com/api/:splat"
  status = 200
  force = true
```

### 2. Test the Application

1. **Create a Firebase user** (if not already done):
   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Or use the provided script: `node create-test-user.js user@example.com password123`

2. **Test login:**
   - Visit your Netlify URL
   - Enter Firebase email, Firebase password, and workspace password
   - Should redirect to dashboard after successful login

3. **Test functionality:**
   - Create recipients
   - Create campaigns
   - Send a test email campaign
   - Verify emails are received

### 3. Configure Custom Domain (Optional)

#### For Netlify:
1. Go to Site settings → Domain management
2. Add your custom domain
3. Update DNS records as instructed

#### For Render:
1. Go to Dashboard → Settings → Custom Domain
2. Add your backend domain
3. Update DNS records

### 4. Set Up Continuous Deployment

Both Render and Netlify automatically redeploy when you push to your main branch:
- Push changes to GitHub
- Both services will automatically rebuild and deploy

## Important Security Notes

1. **Never commit `.env` files** - They're already gitignored
2. **Never commit Firebase service account JSON** - Add to `.gitignore`
3. **Use strong passwords** - Change `WORKSPACE_PASSWORD` from default
4. **Rotate secrets regularly** - Update APP_SECRET_KEY periodically
5. **Secure Firebase rules** - Set up proper security rules in Firebase Console
6. **Enable HTTPS** - Both Render and Netlify provide free SSL certificates
7. **Monitor logs** - Check Render, Netlify, and Firebase logs for errors
8. **Restrict Firebase API keys** - Configure API key restrictions in Google Cloud Console

## Troubleshooting

### Backend Issues

**Service won't start:**
- Check Render logs for build errors
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is correct

**CORS errors:**
- Verify `CLIENT_URL` matches your Netlify URL exactly
- Check that CORS is configured in `server/src/index.ts`

### Frontend Issues

**API requests failing:**
- Verify `netlify.toml` has correct backend URL
- Check browser console for errors
- Ensure backend is deployed and running

**Build failures:**
- Check Netlify build logs
- Verify `package.json` scripts are correct
- Ensure all dependencies are listed

### Database Connection Issues

**MongoDB connection timeout:**
- Whitelist Render's IP addresses in MongoDB Atlas
- Or use `0.0.0.0/0` (less secure but works)
- Verify connection string is correct

### Firebase Authentication Issues

**"Firebase Admin not initialized"**
- Verify all three Firebase environment variables are set on Render
- Check FIREBASE_PRIVATE_KEY format (should include quotes and `\n` escapes)
- Review Render logs for Firebase initialization errors
- Ensure service account has correct permissions in Firebase Console

**"Invalid or expired token"**
- Verify Firebase Authentication is enabled in Firebase Console
- Check Email/Password sign-in provider is enabled
- Ensure test user exists in Firebase Authentication → Users section
- Verify frontend Firebase config matches your project
- Check browser console for Firebase client errors

**"Invalid workspace password"**
- User needs THREE credentials: Firebase email, Firebase password, AND workspace password
- Verify WORKSPACE_PASSWORD environment variable on Render
- Workspace password is your custom security layer

**"Configuration not found"**
- Enable Firebase Authentication: Firebase Console → Build → Authentication → Get started
- Enable Email/Password sign-in method
- Wait a few minutes for changes to propagate

**"Login successful but not redirecting"**
- Check browser console for errors
- Verify all Firebase environment variables on Netlify
- Ensure frontend can communicate with backend (check CORS)

## Free Tier Limitations

### Render Free Tier:
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free

### Netlify Free Tier:
- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited sites

## Upgrading

To handle more traffic, consider:
- **Render**: Upgrade to Starter ($7/month) for always-on service
- **Netlify**: Pro plan ($19/month) for more bandwidth
- **MongoDB Atlas**: Upgrade from free tier for better performance

## Environment Variables Reference

### Backend (Render)

| Variable | Description | Required |
|----------|-------------|----------|
| NODE_ENV | Environment mode | Yes (production) |
| PORT | Server port | Yes (3001) |
| APP_SECRET_KEY | 32-byte hex for encryption | Yes |
| WORKSPACE_PASSWORD | Additional login password | Yes |
| RESEND_API_KEY | Resend email API key | Yes |
| RESEND_FROM_EMAIL | Verified sender email | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| CLIENT_URL | Frontend URL for CORS | Yes |
| FIREBASE_PROJECT_ID | Firebase project ID | **Yes** |
| FIREBASE_CLIENT_EMAIL | Firebase service email | **Yes** |
| FIREBASE_PRIVATE_KEY | Firebase private key | **Yes** |

### Frontend (Netlify)

| Variable | Description | Required |
|----------|-------------|----------|
| VITE_FIREBASE_API_KEY | Firebase Web API key | Yes |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase auth domain | Yes |
| VITE_FIREBASE_PROJECT_ID | Firebase project ID | Yes |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase storage bucket | Yes |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase messaging sender ID | Yes |
| VITE_FIREBASE_APP_ID | Firebase app ID | Yes |

## Support

For issues:
1. Check Render logs for backend errors
2. Check Netlify logs for frontend build errors
3. Review browser console for client errors
4. Check MongoDB Atlas logs for database issues
