# Email Marketing App

A production-ready, full-stack email marketing application built with React, Express, MongoDB, and Resend. This application allows multiple companies to manage email campaigns with secure credential storage and dynamic configuration.

## Features

- **Secure Authentication**: Simple workspace login with JWT-based sessions
- **Dynamic Configuration**: Each company can configure their own sender details and API credentials
- **Encrypted Secrets**: All sensitive data (API keys, MongoDB URIs) encrypted at rest using AES-256-GCM
- **Recipient Management**: Add individual recipients or bulk import via email list
- **Campaign Creation**: Create HTML email campaigns with personalization support
- **Intelligent Sending**: Concurrent email sending with retry logic and rate limiting
- **Activity Tracking**: Comprehensive logs of all email sends with status tracking
- **Dashboard**: Real-time statistics and recent activity overview

## Tech Stack

### Frontend
- Vite + React 18 + TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication

### Backend
- Node.js + Express + TypeScript
- MongoDB with Mongoose ODM
- Resend SDK for email delivery
- Zod for request validation
- AES-256-GCM encryption for secrets
- JWT for authentication
- Helmet, CORS, and rate limiting for security

## Project Structure

```
/
├── client/                 # Vite React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── api.ts         # API client
│   │   ├── AuthContext.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Express API backend
│   ├── src/
│   │   ├── middleware/    # Auth & error handling
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Encryption utilities
│   │   ├── scripts/       # Seed scripts
│   │   └── index.ts       # Server entry
│   ├── package.json
│   └── tsconfig.json
├── package.json           # Root package for concurrently
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Resend account with verified sender email

### Installation

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure server environment:**
   ```bash
   cd server
   cp .env.example .env
   ```

3. **Edit `server/.env` and set required variables:**
   ```env
   # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   APP_SECRET_KEY=your_32_byte_hex_encryption_key

   # Generate secure random string
   JWT_SECRET=your_jwt_secret

   # Set a strong workspace password
   WORKSPACE_PASSWORD=your_secure_password

   # Server config
   PORT=3001
   NODE_ENV=development

   # Optional: Set defaults (can also be set via UI)
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   MONGODB_URI=mongodb://localhost:27017/email-marketing

   # Client URL for CORS
   CLIENT_URL=http://localhost:5173
   ```

4. **Generate encryption key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Start development servers:**
   ```bash
   cd ..
   npm run dev
   ```

   This starts both frontend (http://localhost:5173) and backend (http://localhost:3001)

### First-Time Setup

1. **Login** with your `WORKSPACE_PASSWORD`
2. Navigate to **Settings** page
3. Configure:
   - Company Name
   - Sender Name  
   - Sender Email (must be verified in Resend)
   - Resend API Key
   - MongoDB URI (if not using env default)
4. Test connections using the test buttons
5. Add recipients via **Recipients** page
6. Create and send campaigns via **Campaigns** page

## API Endpoints

### Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "your_password"}' \
  -c cookies.txt

# Check auth status
curl http://localhost:3001/api/auth/check -b cookies.txt

# Logout
curl -X POST http://localhost:3001/api/auth/logout -b cookies.txt
```

### Settings
```bash
# Get settings
curl http://localhost:3001/api/settings -b cookies.txt

# Update settings
curl -X POST http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "companyName": "My Company",
    "senderName": "Support Team",
    "senderEmail": "support@mycompany.com",
    "resendApiKey": "re_xxx",
    "mongoUri": "mongodb://localhost:27017/mydb"
  }'

# Test Resend connection
curl -X POST http://localhost:3001/api/settings/test-resend \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"testEmail": "test@example.com"}'
```

### Recipients
```bash
# List recipients
curl http://localhost:3001/api/recipients -b cookies.txt

# Add single recipient
curl -X POST http://localhost:3001/api/recipients \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "tags": ["customer", "vip"]
  }'

# Bulk import
curl -X POST http://localhost:3001/api/recipients/bulk \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "emails": ["user1@example.com", "user2@example.com"]
  }'

# Delete recipient
curl -X DELETE http://localhost:3001/api/recipients/RECIPIENT_ID -b cookies.txt
```

### Campaigns
```bash
# List campaigns
curl http://localhost:3001/api/campaigns -b cookies.txt

# Create campaign
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Welcome Campaign",
    "subject": "Welcome to Our Service!",
    "htmlBody": "<h1>Hello {{name}}!</h1><p>Welcome to our service at {{email}}</p>"
  }'

# Send campaign to all
curl -X POST http://localhost:3001/api/campaigns/CAMPAIGN_ID/send \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"sendToAll": true}'

# Send to specific tags
curl -X POST http://localhost:3001/api/campaigns/CAMPAIGN_ID/send \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "sendToAll": false,
    "tags": ["customer", "vip"]
  }'
```

### Logs
```bash
# Get all logs
curl http://localhost:3001/api/logs -b cookies.txt

# Filter by status
curl "http://localhost:3001/api/logs?status=sent&limit=50" -b cookies.txt
```

## Email Personalization

Use these placeholders in your HTML email body:
- `{{name}}` - Recipient's name
- `{{email}}` - Recipient's email address

Example:
```html
<h1>Hello {{name}}!</h1>
<p>This email was sent to {{email}}</p>
```

## Security Features

1. **Encrypted Secrets**: All API keys and database URIs are encrypted using AES-256-GCM before storage
2. **httpOnly Cookies**: JWT tokens stored in secure, httpOnly cookies
3. **Rate Limiting**: API requests limited to prevent abuse
4. **Helmet**: Security headers configured
5. **CORS**: Restricted to configured client URL
6. **No Secret Exposure**: GET endpoints never return decrypted secrets
7. **Input Validation**: All inputs validated with Zod schemas

## Production Deployment

### Quick Deploy

See [QUICKDEPLOY.md](./QUICKDEPLOY.md) for a quick 3-step deployment guide.

### Full Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:
- Render (backend) setup
- Netlify (frontend) setup
- Environment variable configuration
- Custom domain setup
- Troubleshooting

### Pre-Deployment Checklist

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for a complete checklist before going live.

### Environment Variables

Ensure all required variables are set:
- `APP_SECRET_KEY` - 32-byte hex encryption key
- `JWT_SECRET` - JWT signing secret
- `WORKSPACE_PASSWORD` - Login password
- `MONGODB_URI` - Production MongoDB connection string
- `RESEND_API_KEY` - (Optional) Default Resend key
- `NODE_ENV=production`
- `CLIENT_URL` - Production frontend URL

### Build

```bash
# Build both client and server
npm run build

# Or individually
cd server && npm run build
cd client && npm run build
```

### Run Production

```bash
# Server
cd server && npm start

# Client - serve the dist/ folder with any static server
cd client && npx serve -s dist
```

## Seed Script

To create initial workspace settings from environment variables:

```bash
cd server
npm run seed
```

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB is running
- Ensure network access (whitelist IP in MongoDB Atlas)

### Resend Email Failures
- Verify sender email is verified in Resend dashboard
- Check API key is valid
- Review Resend API limits

### Authentication Issues
- Clear browser cookies
- Verify `JWT_SECRET` and `WORKSPACE_PASSWORD` are set
- Check token expiration (7 days default)

## File Tree

```
/workspaces/email-marketing-app/
├── .gitignore
├── README.md
├── package.json
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── src/
│       ├── index.css
│       ├── main.tsx
│       ├── App.tsx
│       ├── api.ts
│       ├── AuthContext.tsx
│       ├── components/
│       │   └── Layout.tsx
│       └── pages/
│           ├── Login.tsx
│           ├── Dashboard.tsx
│           ├── Settings.tsx
│           ├── Recipients.tsx
│           ├── Campaigns.tsx
│           └── Logs.tsx
└── server/
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts
        ├── middleware/
        │   ├── auth.ts
        │   └── errorHandler.ts
        ├── models/
        │   ├── Campaign.ts
        │   ├── Recipient.ts
        │   ├── SendLog.ts
        │   └── WorkspaceSettings.ts
        ├── routes/
        │   ├── auth.ts
        │   ├── campaigns.ts
        │   ├── dashboard.ts
        │   ├── logs.ts
        │   ├── recipients.ts
        │   └── settings.ts
        ├── scripts/
        │   └── seed.ts
        └── utils/
            └── encryption.ts
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.