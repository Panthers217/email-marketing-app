# Resend Webhook Setup Guide

This application supports real-time email tracking through Resend webhooks. Follow this guide to enable delivery tracking, bounce detection, and engagement metrics.

## 🎯 What Webhooks Enable

Once configured, you'll automatically track:
- ✅ **Email Delivered** - Confirmation email reached recipient's inbox
- ⚠️ **Email Bounced** - Email rejected (invalid address, full mailbox, etc.)
- 🚫 **Spam Complaints** - Recipient marked email as spam
- 📖 **Email Opened** - Recipient viewed the email
- 🔗 **Link Clicked** - Recipient clicked a link in the email

## 📋 Setup Steps

### 1. Get Your Webhook URL

Your webhook endpoint is:
```
https://your-domain.com/api/webhooks/resend
```

**Development (Codespaces/Local):**
If developing locally, you need to expose your local server. Options:
- **Codespaces**: Make port 3001 public, use the forwarded URL
- **ngrok**: `ngrok http 3001` then use the ngrok URL
- **Cloudflare Tunnel**: Use `cloudflared tunnel`

**Production:**
Use your deployed server URL (e.g., `https://api.yourapp.com/api/webhooks/resend`)

### 2. Configure Resend Webhook

1. Go to [Resend Dashboard](https://resend.com/webhooks)
2. Click **"Add Webhook"**
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/resend`
4. Select the events you want to track:
   - ✅ `email.delivered`
   - ⚠️ `email.bounced`
   - 🚫 `email.complained`
   - 📖 `email.opened` (optional - requires email tracking)
   - 🔗 `email.clicked` (optional - requires link tracking)
5. Click **"Create Webhook"**
6. **Copy the Webhook Secret** (you'll need this next)

### 3. Add Webhook Secret to Environment Variables

Add the webhook secret to your `.env` file:

```env
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important**: 
- The webhook will work without the secret, but won't verify signatures (less secure)
- With the secret, requests are verified to ensure they come from Resend

### 4. Restart Your Server

```bash
# If using npm
npm run dev

# Or if in production
npm run build
npm start
```

### 5. Test the Webhook

1. Send a test campaign from your app
2. In Resend Dashboard → Webhooks, click on your webhook
3. You should see webhook events being delivered
4. Check your app's Logs page - you should see:
   - "✓ Delivered" badges when emails are delivered
   - "📖 Opened" badges when recipients open emails
   - "🔗 Clicked" badges when recipients click links

## 🔍 Troubleshooting

### Webhook not receiving events

**Check server logs:**
```bash
# You should see:
✓ Server running on port 3001
```

**Test webhook endpoint manually:**
```bash
curl https://your-domain.com/api/webhooks/resend \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"email.delivered","data":{"email_id":"test"}}'
```

Expected response: `{"error":"Send log not found"}` (this is OK - means endpoint is working)

### Webhooks received but not updating logs

1. Check that `resendMessageId` is being saved when emails are sent
2. Verify webhook secret matches in `.env` and Resend dashboard
3. Check server console for webhook processing logs:
   ```
   Received Resend webhook: email.delivered
   ✓ Email delivered: user@example.com
   ```

### Signature verification failing

If you see `Invalid webhook signature` errors:
1. Ensure `RESEND_WEBHOOK_SECRET` is correctly set in `.env`
2. Verify the secret matches exactly what's in Resend dashboard
3. Make sure you restarted the server after adding the secret

## 📊 Viewing Webhook Data

### Logs Page
- Navigate to **Logs** in your app
- You'll see new columns:
  - **Delivery**: Shows delivery status with badges
  - **Engagement**: Shows if email was opened/clicked
- **Delivery & Engagement Metrics** section shows:
  - Total delivered emails
  - Bounce count
  - Open rate percentage
  - Click-through rate (CTR)

### Status Indicators
- **✓ Delivered** (blue) - Successfully delivered to inbox
- **⚠ Bounced** (orange) - Failed delivery (hover for reason)
- **🚫 Spam** (purple) - Marked as spam by recipient
- **📖 Opened** (indigo) - Email was opened
- **🔗 Clicked** (teal) - Link was clicked

## 🔐 Security Notes

- Webhook endpoint is **public** (no authentication required)
- Uses **HMAC SHA-256 signature verification** to ensure requests are from Resend
- Without `RESEND_WEBHOOK_SECRET`, signatures won't be verified (not recommended for production)

## 🚀 Production Considerations

### Rate Limits
- Webhooks can send high volume during large campaigns
- Current implementation processes webhooks synchronously
- For very large campaigns (10,000+ emails), consider adding a queue system

### Database Performance
- Webhook handler updates SendLog records by `resendMessageId`
- Ensure the index exists: `resendMessageId` is indexed in the model
- Monitor database performance during large campaigns

### Monitoring
Server logs show webhook activity:
```
Processing batch 1/10 (100 emails)
✓ Email sent to user1@example.com, ID: abc123
Received Resend webhook: email.delivered
✓ Email delivered: user1@example.com
Received Resend webhook: email.opened
📖 Email opened: user1@example.com
```

## 📈 Metrics You Can Track

With webhooks enabled, you can calculate:
- **Delivery Rate**: `delivered / sent * 100%`
- **Bounce Rate**: `bounced / sent * 100%`
- **Open Rate**: `opened / delivered * 100%`
- **Click-Through Rate (CTR)**: `clicked / opened * 100%`
- **Complaint Rate**: `complained / delivered * 100%`

These metrics are automatically displayed in the Logs page Engagement section.

## 🆘 Need Help?

If webhooks aren't working after following this guide:
1. Check server logs for errors
2. Verify webhook URL is publicly accessible
3. Test with Resend's webhook testing tool in their dashboard
4. Ensure server is running and accessible from internet
5. Check firewall/security group rules allow incoming HTTPS

---

**Next Steps:**
1. Complete the setup above
2. Send a test campaign
3. Watch the Logs page update in real-time as emails are delivered and opened! 🎉
