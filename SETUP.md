# Email Marketing App - Development Setup

This guide provides step-by-step instructions for setting up the development environment.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] MongoDB running (local or cloud)
- [ ] Resend account created
- [ ] Sender email verified in Resend

## Setup Steps

### 1. Install All Dependencies

From the project root:

```bash
npm run install:all
```

This installs dependencies for root, client, and server.

### 2. Generate Encryption Keys

```bash
node generate-keys.js
```

Copy the generated keys for the next step.

### 3. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set:
- `APP_SECRET_KEY` (from step 2)
- `JWT_SECRET` (from step 2)
- `WORKSPACE_PASSWORD` (choose a strong password)
- `MONGODB_URI` (your MongoDB connection string)
- `RESEND_API_KEY` (optional, from Resend dashboard)

### 4. Verify MongoDB

Make sure MongoDB is accessible:

```bash
# If using local MongoDB
mongosh

# If using MongoDB Atlas, test connection
mongosh "your_connection_string"
```

### 5. Start Development Servers

From project root:

```bash
npm run dev
```

This starts:
- Backend API on http://localhost:3001
- Frontend app on http://localhost:5173

### 6. Access the Application

1. Open http://localhost:5173
2. Login with your `WORKSPACE_PASSWORD`
3. Go to Settings and configure your workspace
4. Test Resend and MongoDB connections
5. Start adding recipients and creating campaigns!

## Common Issues

### Port Already in Use

If port 3001 or 5173 is taken:

```bash
# Change PORT in server/.env
PORT=3002

# Vite will auto-pick next available port or set in vite.config.ts
```

### MongoDB Connection Failed

- Check MongoDB is running: `sudo systemctl status mongod`
- Verify connection string format
- Check firewall rules

### Resend API Error

- Verify API key is correct
- Verify sender email is verified in Resend dashboard
- Check Resend API status

## Useful Commands

```bash
# Install dependencies
npm run install:all

# Development (both servers)
npm run dev

# Development (individual)
npm run dev:client
npm run dev:server

# Build for production
npm run build

# Server only
cd server
npm run dev          # Development
npm run build        # Build TypeScript
npm start            # Production
npm run seed         # Seed initial data

# Client only
cd client
npm run dev          # Development
npm run build        # Production build
```

## Testing the API

Use the curl examples in the main README.md or import this Postman collection:

Key endpoints to test:
1. POST /api/auth/login
2. GET /api/settings
3. POST /api/recipients
4. POST /api/campaigns
5. POST /api/campaigns/:id/send

## Next Steps

1. Configure workspace settings
2. Import recipients (bulk or individual)
3. Create your first campaign
4. Test send to a small group
5. Monitor logs for delivery status

## Security Reminders

- Never commit .env files
- Use strong passwords
- Keep encryption keys secure
- Rotate secrets periodically
- Use HTTPS in production
- Review Resend sending limits
