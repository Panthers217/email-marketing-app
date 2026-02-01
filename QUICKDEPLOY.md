# Quick Deployment Guide

## 🚀 Deploy in 3 Steps

### 1. Backend (Render)

1. Push your code to GitHub
2. Go to [Render](https://render.com) → New → Web Service
3. Connect your repo and set environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   APP_SECRET_KEY=<32-byte-hex>
   JWT_SECRET=<32-byte-hex>
   WORKSPACE_PASSWORD=<your-password>
   RESEND_API_KEY=<your-key>
   RESEND_FROM_EMAIL=<your-email>
   MONGODB_URI=<your-mongodb-uri>
   CLIENT_URL=<will-be-netlify-url>
   ```
4. Deploy and copy your backend URL

### 2. Frontend (Netlify)

1. Update `netlify.toml` with your Render backend URL
2. Go to [Netlify](https://netlify.com) → New Site → Import project
3. Connect your repo
4. Deploy settings:
   - Base directory: `client`
   - Build command: `npm install && npm run build`
   - Publish directory: `client/dist`
5. Deploy and copy your Netlify URL

### 3. Update CORS

1. Go back to Render
2. Update `CLIENT_URL` env variable with your Netlify URL
3. Redeploy backend

✅ Done! Your app is live.

## 📖 Full Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🔧 Local Development

```bash
# Install dependencies
npm install
cd server && npm install
cd ../client && npm install

# Start backend (terminal 1)
cd server && npm run dev

# Start frontend (terminal 2)
cd client && npm run dev
```

Visit http://localhost:5173

## 🔐 Generate Secrets

```bash
# Generate APP_SECRET_KEY and JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📝 Environment Variables

Copy `.env.example` files and fill in your values:

```bash
# Server
cp server/.env.example server/.env

# Client (optional)
cp client/.env.example client/.env
```
