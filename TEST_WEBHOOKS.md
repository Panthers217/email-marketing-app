# Testing Webhooks - Step by Step Guide

## 🎯 Quick Test (No Setup Required)

### 1. Start the Application
```bash
cd /workspaces/email-marketing-app
npm run dev
```

### 2. Send a Test Email
1. Open your app at http://localhost:5173
2. Go to **Campaigns** → Create a campaign
3. Add **your real email** as a recipient
4. Send the campaign
5. Go to **Logs** page - you should see the email with "sent" status

### 3. Check What You See
**Without webhooks configured:**
- ✅ Status: "sent" (green)
- Delivery: "-" (empty)
- Engagement: "-" (empty)

**With webhooks configured:**
- ✅ Status: "sent" (green)
- ✓ Delivery: "Delivered" (blue) - after ~30 seconds
- 📖 Engagement: "Opened" (indigo) - when you open the email
- 🔗 Engagement: "Clicked" (teal) - when you click a link

---

## 🔧 Test Webhook Endpoint (No Resend Required)

### Manual Test with Curl

First, send a campaign to get a real message ID, then:

```bash
# Get a message ID from your logs
# Then test the webhook endpoint:

curl http://localhost:3001/api/webhooks/resend \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.delivered",
    "data": {
      "email_id": "PASTE_REAL_MESSAGE_ID_HERE",
      "to": "test@example.com",
      "from": "noreply@example.com"
    }
  }'
```

**Expected Response:**
- Success: `{"success":true}`
- Not found: `{"error":"Send log not found"}` (if message ID doesn't exist)

### Test Different Event Types

```bash
# Test email bounced
curl http://localhost:3001/api/webhooks/resend \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.bounced",
    "data": {
      "email_id": "YOUR_MESSAGE_ID",
      "bounce": {
        "reason": "Mailbox full"
      }
    }
  }'

# Test email opened
curl http://localhost:3001/api/webhooks/resend \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.opened",
    "data": {
      "email_id": "YOUR_MESSAGE_ID"
    }
  }'

# Test email clicked
curl http://localhost:3001/api/webhooks/resend \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.clicked",
    "data": {
      "email_id": "YOUR_MESSAGE_ID",
      "link": "https://example.com"
    }
  }'
```

---

## 🌐 Test with Real Resend Webhooks (Codespaces)

### Step 1: Make Port Public

In VS Code Codespaces:
1. Go to **PORTS** tab (bottom panel)
2. Find port **3001**
3. Right-click → **Port Visibility** → **Public**
4. Copy the forwarded URL (e.g., `https://xyz-3001.app.github.dev`)

### Step 2: Configure Resend Webhook

1. Go to [Resend Dashboard](https://resend.com/webhooks)
2. Click **"Add Webhook"**
3. Enter URL: `https://xyz-3001.app.github.dev/api/webhooks/resend`
4. Select events:
   - ✅ `email.delivered`
   - ✅ `email.bounced`
   - ✅ `email.opened`
   - ✅ `email.clicked`
5. Click **"Create"**
6. Copy the **Webhook Secret** (starts with `whsec_`)

### Step 3: Add Secret to Environment

Add to `/workspaces/email-marketing-app/server/.env`:
```env
RESEND_WEBHOOK_SECRET=whsec_your_secret_here
```

Restart server:
```bash
cd /workspaces/email-marketing-app/server
npm run dev
```

### Step 4: Send Test Campaign

1. Send a campaign with your real email
2. Watch the **Logs** page
3. Within 30-60 seconds, you should see:
   - "✓ Delivered" badge appear
4. Open the email in your inbox
5. Refresh Logs page - "📖 Opened" badge should appear
6. Click a link in the email
7. Refresh Logs page - "🔗 Clicked" badge should appear

---

## 🐛 Debugging Webhooks

### Check Server Logs

Your terminal should show webhook activity:

```
[0] Received Resend webhook: email.delivered
[0] ✓ Email delivered: user@example.com
[0] Received Resend webhook: email.opened
[0] 📖 Email opened: user@example.com
```

**Not seeing these?** Webhooks aren't reaching your server.

### Check Resend Dashboard

1. Go to [Resend Webhooks](https://resend.com/webhooks)
2. Click on your webhook
3. See **Recent Deliveries**:
   - ✅ Green checkmarks = successful deliveries
   - ❌ Red X's = failed deliveries

### Common Issues

**Issue 1: Webhook shows 404 in Resend**
- Check your URL is correct
- Must end with `/api/webhooks/resend`
- Port 3001 must be public in Codespaces

**Issue 2: Webhook shows 401 Unauthorized**
- Webhook secret mismatch
- Check `RESEND_WEBHOOK_SECRET` in `.env`
- Restart server after adding secret

**Issue 3: Webhooks succeed but logs don't update**
- Check `resendMessageId` is being saved when emails are sent
- Check database connection
- Look for error logs in terminal

**Issue 4: Server logs show "Send log not found"**
- This is normal if testing with fake IDs
- Use real message IDs from actual sent campaigns

---

## 📊 Verify Results

### In the Logs Page

After sending and receiving/opening email:

**You should see:**
```
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ Status      │ Delivery     │ Engagement   │ Sent At      │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ ✅ sent     │ ✓ Delivered  │ 📖 Opened    │ 2/2/26 10:30 │
│             │              │ 🔗 Clicked   │              │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

**Engagement Metrics section:**
```
📬 Delivery & Engagement Metrics
┌────────────┬──────────┬─────────┬──────────┐
│ Delivered  │ Bounced  │ Opened  │ Clicked  │
│    150     │    5     │   45    │    12    │
│            │          │  30.0%  │  26.7%   │
└────────────┴──────────┴─────────┴──────────┘
```

### In MongoDB

Check the database directly:

```javascript
// In MongoDB shell or Compass
db.sendlogs.findOne({ recipientEmail: "your@email.com" })

// Should show:
{
  status: "sent",
  deliveryStatus: "delivered",
  deliveredAt: ISODate("2026-02-02T10:30:45.000Z"),
  openedAt: ISODate("2026-02-02T10:31:20.000Z"),
  clickedAt: ISODate("2026-02-02T10:31:45.000Z"),
  webhookEvents: [
    { type: "email.delivered", timestamp: ... },
    { type: "email.opened", timestamp: ... },
    { type: "email.clicked", timestamp: ... }
  ]
}
```

---

## ✅ Success Checklist

- [ ] Server running on port 3001
- [ ] Can send campaigns successfully
- [ ] Logs show "sent" status immediately
- [ ] Webhook endpoint responds to curl tests
- [ ] (Optional) Port 3001 is public in Codespaces
- [ ] (Optional) Resend webhook configured
- [ ] (Optional) Webhook secret added to .env
- [ ] (Optional) Can see "Delivered" status after sending
- [ ] (Optional) Can see "Opened" status after opening email
- [ ] (Optional) Can see "Clicked" status after clicking link

---

## 🎓 Understanding the Flow

```
1. Send Campaign
   ↓ (immediate)
2. Status: "sent" + resendMessageId saved
   ↓ (30-60 seconds)
3. Resend delivers email
   ↓ (webhook triggered)
4. POST /api/webhooks/resend { type: "email.delivered" }
   ↓ (database updated)
5. Logs page shows: "✓ Delivered"
   ↓ (user opens email)
6. POST /api/webhooks/resend { type: "email.opened" }
   ↓ (database updated)
7. Logs page shows: "📖 Opened"
```

---

## 🚀 Production Testing

For production deployment:

1. **Deploy your app** to a public server
2. **Use the production URL** in Resend webhook config
3. **Add webhook secret** to production environment variables
4. **Send test campaign** to yourself
5. **Monitor logs** for webhook events
6. **Check Logs page** for real-time updates

That's it! You now have full email delivery and engagement tracking! 🎉
