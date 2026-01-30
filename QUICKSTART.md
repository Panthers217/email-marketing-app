# 🚀 Quick Start Guide

Get the Email Marketing App running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MongoDB running (or use MongoDB Atlas free tier)

## Steps

### 1. Generate Keys (✅ Already Done!)

The encryption keys have been generated and added to `server/.env`

### 2. Set Workspace Password

Edit `server/.env` and change:
```env
WORKSPACE_PASSWORD=demo123
```
to a secure password of your choice.

### 3. Configure MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB (if using local)
sudo systemctl start mongod
# OR
brew services start mongodb-community
```

**Option B: MongoDB Atlas** (Free tier)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `server/.env`

### 4. Configure Resend (Optional for now)

You can configure this later via the UI. To set it now:
1. Sign up at https://resend.com
2. Verify your sender email
3. Get API key from dashboard
4. Add to `RESEND_API_KEY` in `server/.env`

### 5. Start the Application

```bash
npm run dev
```

This starts both frontend and backend servers.

### 6. Login & Configure

1. Open http://localhost:5173
2. Login with your `WORKSPACE_PASSWORD` (default: demo123)
3. Go to **Settings** page
4. Fill in:
   - Company Name
   - Sender Name
   - Sender Email (must be verified in Resend)
   - Resend API Key (if not in .env)
   - MongoDB URI (if not in .env)
5. Click **Test Resend Connection** and **Test MongoDB Connection**
6. Click **Save Settings**

### 7. Add Recipients

Go to **Recipients** page:
- Click "Add Single" for one recipient
- Click "Bulk Import" to paste multiple emails (one per line)

### 8. Create Campaign

Go to **Campaigns** page:
1. Click "Create Campaign"
2. Enter name and subject
3. Click "Use Template" for a starter HTML template
4. Customize the HTML (use `{{name}}` and `{{email}}` for personalization)
5. Click "Create Campaign"

### 9. Send Campaign

1. Find your campaign in the list
2. Click "Send"
3. Choose "Send to all recipients" or filter by tags
4. Click "Send Now"

### 10. View Results

Go to **Logs** page to see delivery status of all emails!

## Default Credentials

- **Workspace Password**: `demo123` (change in `server/.env`)
- **MongoDB URI**: `mongodb://localhost:27017/email-marketing`

## Troubleshooting

### Can't connect to MongoDB?
```bash
# Check if MongoDB is running
mongosh
# If error, start MongoDB first
```

### Port already in use?
Change `PORT=3001` to another port in `server/.env`

### Resend test email fails?
1. Verify sender email in Resend dashboard first
2. Check API key is correct
3. Wait a few minutes after email verification

## What's Next?

- Explore the **Dashboard** for statistics
- Filter **Recipients** by tags
- View **Logs** to track email delivery
- Create multiple campaigns
- Configure tags for recipient segmentation

## Support

See the main [README.md](README.md) for detailed documentation and API examples.

---

**Ready to go?** Run `npm run dev` and open http://localhost:5173! 🎉
