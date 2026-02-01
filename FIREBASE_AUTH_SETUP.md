# Firebase Authentication Setup Guide

This application now uses Firebase Authentication for user management and authentication.

## Overview

The authentication system combines:
1. **Firebase Authentication** - For user accounts and login
2. **Workspace Password** - Additional security layer for workspace access
3. **Firebase ID Tokens** - Secure, signed JWT tokens from Firebase

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or select an existing project
3. Follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Click "Save"

### 3. Create a User Account

1. In Firebase Console, go to **Authentication** > **Users**
2. Click "Add user"
3. Enter an email and password
4. Click "Add user"

### 4. Get Firebase Configuration

#### For Client (Web App)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to register a web app
4. Copy the configuration values

Update `/client/.env`:
```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### For Server (Firebase Admin SDK)

##### Option 1: Service Account File (Recommended for Local Development)

1. In Firebase Console, go to **Project Settings** > **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json` in your server directory
4. Add to `/server/.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

##### Option 2: Environment Variables (Recommended for Production)

1. Open the service account JSON file
2. Extract the values and add to `/server/.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
   ```

**Important:** Keep the private key wrapped in quotes and preserve the `\n` characters.

### 5. Set Workspace Password

In `/server/.env`, set your workspace password:
```env
WORKSPACE_PASSWORD=YourSecurePasswordHere
```

## How Authentication Works

### Login Flow

1. **User enters credentials**:
   - Email address (Firebase account)
   - Account password (Firebase password)
   - Workspace password (your custom password)

2. **Client authenticates with Firebase**:
   ```typescript
   const userCredential = await signInWithEmailAndPassword(auth, email, password);
   const idToken = await userCredential.user.getIdToken();
   ```

3. **Client sends token + workspace password to backend**:
   ```typescript
   await authAPI.login(idToken, workspacePassword);
   ```

4. **Server verifies both**:
   - Validates Firebase ID token using Admin SDK
   - Checks workspace password matches environment variable
   - Sets custom claim for workspace access

5. **Subsequent requests**:
   - Client automatically attaches Firebase ID token to requests
   - Server middleware verifies token on each protected endpoint

### Token Management

- **Firebase handles token refresh automatically**
- Tokens are short-lived (1 hour) and refreshed in the background
- No need to manually manage JWT secrets or expiration

### Security Features

✅ Industry-standard authentication from Google  
✅ Token rotation and automatic refresh  
✅ Additional workspace password layer  
✅ Custom claims for authorization  
✅ Secure token verification on backend  

## API Endpoints

### POST `/api/auth/login`
Login with Firebase token and workspace password.

**Request:**
```json
{
  "idToken": "firebase-id-token",
  "workspacePassword": "your-workspace-password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user-uid",
    "email": "user@example.com"
  }
}
```

### POST `/api/auth/verify`
Verify current authentication status.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "uid": "user-uid",
    "email": "user@example.com"
  }
}
```

### POST `/api/auth/logout`
Logout and revoke workspace access.

## Development

### Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### Run the Application

```bash
# Server (terminal 1)
cd server
npm run dev

# Client (terminal 2)
cd client
npm run dev
```

## Production Deployment

### Environment Variables

**Server:**
```env
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
WORKSPACE_PASSWORD=your-secure-password
CLIENT_URL=https://your-domain.com
```

**Client:**
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Deployment Platforms

#### Render, Railway, Fly.io, etc.
- Add environment variables in the platform's dashboard
- Ensure `FIREBASE_PRIVATE_KEY` is properly escaped

#### Vercel, Netlify (Client)
- Add environment variables with `VITE_` prefix
- Redeploy after updating variables

## Troubleshooting

### "Firebase Admin not initialized"
- Check that Firebase environment variables are set correctly
- Verify service account JSON file path (if using file method)
- Ensure private key includes proper newlines (`\n`)

### "Invalid or expired token"
- Token may have expired (automatically refreshed by Firebase)
- User may not have workspace access (check custom claims)
- Verify Firebase config in client `.env`

### "Invalid workspace password"
- Check `WORKSPACE_PASSWORD` in server `.env`
- Ensure no extra spaces or quotes

### Authentication loop/redirect issues
- Clear browser cache and cookies
- Check that all Firebase config values are correct
- Verify CORS settings allow your client URL

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong workspace password** - At least 12 characters
3. **Rotate passwords periodically** - Update every 90 days
4. **Restrict Firebase project access** - Use IAM roles
5. **Enable Firebase security rules** - If using Firestore/Storage
6. **Monitor authentication logs** - Check Firebase Console regularly

## Migration from JWT

All JWT-related code has been removed:
- ❌ `jsonwebtoken` package
- ❌ `cookie-parser` package
- ❌ `JWT_SECRET` environment variable
- ❌ Custom JWT signing/verification
- ❌ Cookie-based sessions

Replaced with:
- ✅ Firebase Authentication
- ✅ Firebase Admin SDK
- ✅ Bearer token authentication
- ✅ Custom claims for authorization
