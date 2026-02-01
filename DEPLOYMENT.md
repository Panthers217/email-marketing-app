# Deployment Guide

This guide covers deploying the Email Marketing App with the backend on Render and the frontend on Netlify.

## Prerequisites

1. GitHub account with your repository pushed
2. Render account (https://render.com)
3. Netlify account (https://netlify.com)
4. MongoDB Atlas database (already configured)
5. Resend API key
6. Firebase Admin credentials (optional)

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
JWT_SECRET=<generate-32-byte-hex-string>
WORKSPACE_PASSWORD=<your-secure-password>
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=<your-verified-sender-email>
MONGODB_URI=<your-mongodb-connection-string>
CLIENT_URL=<your-netlify-url>
```

**Optional Firebase Variables** (if using Firebase):
```
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
FIREBASE_PRIVATE_KEY=<your-private-key-with-escaped-newlines>
```

**Important Notes:**
- Generate new secure keys for `APP_SECRET_KEY` and `JWT_SECRET` using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- For `FIREBASE_PRIVATE_KEY`, replace actual newlines with `\n` escape sequences
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

### Step 3: Configure Environment Variables (Optional)

If you need any frontend environment variables:

1. Go to Site settings → Environment variables
2. Add any required variables (currently none needed)

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

1. Visit your Netlify URL
2. Try logging in with your workspace password
3. Test creating recipients and campaigns
4. Send a test email campaign

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
2. **Use strong passwords** - Change `WORKSPACE_PASSWORD` from default
3. **Rotate secrets regularly** - Update JWT_SECRET and APP_SECRET_KEY periodically
4. **Enable HTTPS** - Both Render and Netlify provide free SSL certificates
5. **Monitor logs** - Check Render and Netlify logs for errors

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
| JWT_SECRET | 32-byte hex for JWT tokens | Yes |
| WORKSPACE_PASSWORD | Login password | Yes |
| RESEND_API_KEY | Resend email API key | Yes |
| RESEND_FROM_EMAIL | Verified sender email | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| CLIENT_URL | Frontend URL for CORS | Yes |
| FIREBASE_PROJECT_ID | Firebase project ID | No |
| FIREBASE_CLIENT_EMAIL | Firebase service email | No |
| FIREBASE_PRIVATE_KEY | Firebase private key | No |

### Frontend (Netlify)

No environment variables required. API URL is configured in `netlify.toml`.

## Support

For issues:
1. Check Render logs for backend errors
2. Check Netlify logs for frontend build errors
3. Review browser console for client errors
4. Check MongoDB Atlas logs for database issues
