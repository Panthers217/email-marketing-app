# 🚀 Complete Setup & Deployment Guide

This guide walks you through setting up the Email Marketing App from scratch to production deployment.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup (MongoDB Atlas)](#database-setup)
4. [Email Service Setup (Resend)](#email-service-setup)
5. [Firebase Setup (Optional)](#firebase-setup-optional)
6. [Testing Locally](#testing-locally)
7. [Production Deployment](#production-deployment)
8. [Post-Deployment](#post-deployment)

---

## Prerequisites

Before you begin, make sure you have:

- ✅ Node.js 18+ installed ([Download](https://nodejs.org/))
- ✅ npm or yarn package manager
- ✅ Git installed
- ✅ GitHub account
- ✅ Code editor (VS Code recommended)

## Local Development Setup

### Step 1: Clone or Download the Repository

```bash
git clone https://github.com/your-username/email-marketing-app.git
cd email-marketing-app
```

### Step 2: Install All Dependencies

```bash
npm run install:all
```

This installs dependencies for root, server, and client.

### Step 3: Generate Secret Keys

```bash
npm run generate-keys
```

Copy the generated keys - you'll need them for the `.env` file.

### Step 4: Configure Server Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and add your configuration:

```env
# Use the generated keys from step 3
APP_SECRET_KEY=<paste-generated-key-here>
JWT_SECRET=<paste-generated-key-here>

# Choose a strong password for your workspace
WORKSPACE_PASSWORD=your-secure-password-123

# Server configuration
PORT=3001
NODE_ENV=development

# MongoDB connection (set up in next section)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Resend credentials (set up in later section)
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Client URL
CLIENT_URL=http://localhost:5173
```

---

## Database Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select your preferred cloud provider and region
   - Name your cluster (e.g., "email-marketing")
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `email_app_user` (or your choice)
   - Password: Generate secure password
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Option 1 (Development): Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Option 2 (Secure): Add your specific IP address
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `email_marketing`)
   - Add to `MONGODB_URI` in `.env`

Example:
```
MONGODB_URI=mongodb+srv://email_app_user:your-password@cluster0.xxxxx.mongodb.net/email_marketing?retryWrites=true&w=majority
```

### Option 2: Local MongoDB

1. **Install MongoDB**
   - Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB**
   ```bash
   # Mac (if installed via Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # MongoDB service starts automatically
   ```

3. **Configure Connection**
   ```env
   MONGODB_URI=mongodb://localhost:27017/email_marketing
   ```

---

## Email Service Setup

### Resend Setup

1. **Create Account**
   - Go to [Resend](https://resend.com)
   - Sign up for free account

2. **Add Domain (Recommended)**
   - Go to "Domains" in dashboard
   - Click "Add Domain"
   - Enter your domain (e.g., `yourdomain.com`)
   - Add DNS records as instructed (SPF, DKIM, DMARC)
   - Wait for verification (usually 15 minutes)

3. **Verify Sender Email**
   - If you don't have a domain, verify individual email:
   - Go to "Settings" → "Sending Addresses"
   - Add email address and verify via email

4. **Generate API Key**
   - Go to "API Keys" in dashboard
   - Click "Create API Key"
   - Name it (e.g., "Production")
   - Copy the key (starts with `re_`)
   - Add to `RESEND_API_KEY` in `.env`

5. **Configure in .env**
   ```env
   RESEND_API_KEY=re_abc123xyz...
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

---

## Firebase Setup (Optional)

Only follow this section if you need Firebase Admin SDK integration.

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project"
   - Follow setup wizard

2. **Generate Service Account**
   - Go to Project Settings (gear icon)
   - Click "Service accounts" tab
   - Click "Generate new private key"
   - Download JSON file

3. **Configure for Local Development**
   - Save JSON file as `server/firebase-service-account.json`
   - Add to `.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

4. **Configure for Production**
   - Open the JSON file and extract:
     - `project_id`
     - `client_email`
     - `private_key`
   - You'll add these as environment variables on Render

---

## Testing Locally

### Step 1: Start Development Servers

Open terminal and run:

```bash
# From root directory
npm run dev
```

This starts:
- Backend server on http://localhost:3001
- Frontend dev server on http://localhost:5173

### Step 2: Test the Application

1. **Open Browser**
   - Go to http://localhost:5173

2. **Login**
   - Use your `WORKSPACE_PASSWORD` from `.env`

3. **Configure Settings** (if not using .env defaults)
   - Navigate to Settings page
   - Enter Company Name, Sender Name, Sender Email
   - Enter Resend API Key
   - Click "Save Settings"

4. **Test Email Sending**
   - Click "Test Email Connection"
   - Enter your email address
   - Check if email arrives

5. **Add Recipients**
   - Go to Recipients page
   - Add a few test recipients

6. **Create Campaign**
   - Go to Campaigns page
   - Create a test campaign
   - Use personalization: `Hello {{name}}!`

7. **Send Test Campaign**
   - Send to specific recipients
   - Check emails arrive correctly

---

## Production Deployment

### Prerequisites for Deployment

- ✅ Code working locally
- ✅ GitHub repository created and code pushed
- ✅ MongoDB Atlas cluster set up
- ✅ Resend API key and verified sender
- ✅ Render account ([Sign up](https://render.com))
- ✅ Netlify account ([Sign up](https://netlify.com))

### Deployment Checklist

Before deploying, review [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

### Step-by-Step Deployment

Follow [QUICKDEPLOY.md](./QUICKDEPLOY.md) for quick deployment or [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

#### Quick Summary:

**1. Deploy Backend to Render:**
   - Create new Web Service
   - Connect GitHub repo
   - Set environment variables
   - Deploy

**2. Deploy Frontend to Netlify:**
   - Update `netlify.toml` with Render URL
   - Create new site
   - Connect GitHub repo
   - Deploy

**3. Update CORS:**
   - Update `CLIENT_URL` on Render with Netlify URL
   - Redeploy backend

---

## Post-Deployment

### Verification Steps

1. **Test Backend**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Test Frontend**
   - Visit your Netlify URL
   - Login with workspace password
   - Test all features

3. **Test Email Sending**
   - Create test campaign
   - Send to test recipient
   - Verify email delivery

### Security Checklist

- [ ] Changed `WORKSPACE_PASSWORD` from default
- [ ] Using strong, unique `APP_SECRET_KEY` and `JWT_SECRET`
- [ ] No `.env` files committed to Git
- [ ] Firebase service account not in repository
- [ ] MongoDB not publicly accessible
- [ ] HTTPS enabled (automatic on Render/Netlify)

### Monitoring

1. **Backend Logs**
   - Render Dashboard → Logs
   - Monitor for errors

2. **Email Delivery**
   - Resend Dashboard → Logs
   - Track send success rate

3. **Database**
   - MongoDB Atlas → Metrics
   - Monitor connections and performance

### Custom Domain Setup (Optional)

#### Netlify:
1. Site Settings → Domain Management
2. Add custom domain
3. Update DNS records

#### Render:
1. Dashboard → Settings → Custom Domain
2. Add domain
3. Update DNS records

---

## Troubleshooting

### Common Issues

**"npm install" fails**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (need 18+)

**"MongoDB connection failed"**
- Check connection string format
- Verify database user credentials
- Check network access (whitelist 0.0.0.0/0)

**"Resend emails not sending"**
- Verify sender email is verified
- Check API key is valid
- Review Resend dashboard logs

**"CORS errors in production"**
- Verify `CLIENT_URL` matches Netlify URL exactly
- No trailing slash in URL
- Redeploy after changing

**"Backend sleeps on Render free tier"**
- Expected behavior
- First request after 15min takes 30-60 seconds
- Upgrade to paid plan for always-on

---

## Next Steps

Once deployed:

1. **Set Up Monitoring**
   - Configure uptime monitoring (e.g., UptimeRobot)
   - Set up error alerts

2. **Backup Strategy**
   - Enable MongoDB Atlas automated backups
   - Export important data regularly

3. **Scale as Needed**
   - Monitor usage on Render and Netlify
   - Upgrade plans when approaching limits

4. **Regular Maintenance**
   - Update dependencies monthly: `npm update`
   - Review and rotate secrets quarterly
   - Monitor security advisories

---

## Support Resources

- **Documentation**: See other `.md` files in root
- **MongoDB**: https://www.mongodb.com/docs/
- **Resend**: https://resend.com/docs
- **Render**: https://render.com/docs
- **Netlify**: https://docs.netlify.com

---

## Quick Reference

### Generate New Secrets
```bash
npm run generate-keys
```

### Start Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Environment Variables
See `.env.example` files in `server/` and `client/` directories

---

**🎉 Congratulations!** You now have a fully functional email marketing application running in production!
