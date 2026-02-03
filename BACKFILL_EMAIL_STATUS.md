# Backfilling Email Status from Resend

This guide explains how to retrieve and update historical email statuses (opens, clicks, deliveries, bounces) for emails sent before webhooks were configured.

## Overview

**The Problem:** If you sent emails through Resend before setting up webhooks, those emails won't have delivery status, open, or click tracking data in your database. Additionally, some emails may show error messages like "Unknown response from batch send" or "Failed in batch send" even though they were actually sent successfully.

**The Solution:** Resend's API allows you to retrieve email data retroactively. This backfill script fetches that historical data and updates your database, including fixing incorrectly marked failed emails.

## What Gets Updated

The script retrieves and updates the following data for each email:

- ✅ **Status Correction**: Emails marked as "failed" due to batch send errors are corrected to "sent" if found in Resend
- ✅ **Delivery Status**: `delivered`, `bounced`, or `complained`
- 📖 **Opens**: Whether and when the email was opened
- 🔗 **Clicks**: Whether and when links were clicked
- ⚠️ **Bounce Reasons**: Why an email bounced (if applicable)
- 📅 **Timestamps**: Exact times for all events

### Specific Error Messages Handled

The script specifically checks and corrects emails with these error messages:
- "Unknown response from batch send"
- "Failed in batch send"
- "No data returned from batch send"
- "Batch send failed"

## Prerequisites

1. **Resend API Key**: Must be set in your `.env` file
2. **MongoDB Connection**: Database must be accessible
3. **Sent Emails**: Emails must have been sent through Resend and have a `resendMessageId`

## How to Run

### Step 1: Navigate to the server directory

```bash
cd server
```

### Step 2: Ensure your environment variables are set

Make sure your `.env` file contains:
```env
RESEND_API_KEY=your_api_key_here
MONGODB_URI=your_mongodb_connection_string
```

### Step 3: Run the backfill script

```bash
npm run backfill:emails
```

## What to Expect

The script will:

1. **Connect** to your MongoDB database
2. **Find** all emails meeting either criteria:
   - Has a `resendMessageId` but no delivery status (pre-webhook emails)
   - Has status "failed" with batch-related error messages (possibly incorrect)
3. **Query** the Resend API for each email's current status
4. **Correct** any emails that were incorrectly marked as failed
5. **Update** your database with the retrieved information
6. **Display** progress and a summary

### Sample Output

```
🔄 Starting email status backfill...

✓ Connected to MongoDB

✓ Initialized Resend client

📧 Found 150 emails to check

[1/150] Checking email 4ef2f9e1-b582-4a0e-9a7b-8c74d2e45aa9 (user@example.com)...
  ✓ Actually sent (was incorrectly marked as failed)
  ✓ Delivered
  📖 Opened
  🔗 Clicked
  ✅ Updated

[2/150] Checking email 7bc3a8f2-d493-5b1f-0b8c-9d85e3f56bb0 (another@example.com)...
  ✓ Delivered
  ℹ️  No updates needed

[3/150] Skipping failed@example.com - no message ID (never sent to Resend)

...

============================================================
📊 Backfill Summary
============================================================
Total emails processed: 150
✓ Successfully checked: 148
✓ Updated with new data: 95
⚠️  Not found in Resend: 2
⚠️  No message ID (never sent): 5
❌ Errors: 0
============================================================

✓ Disconnected from MongoDB

✅ Backfill complete!
```

## Important Notes

### Rate Limiting

- The script automatically throttles requests to ~1.67 per second (600ms delay)
- Resend allows 2 requests/second on the `/emails/{id}` endpoint
- For large datasets (1000+ emails), the script may take 10+ minutes

### Email Retention

- Resend retains email data for **30 days** by default
- Emails older than 30 days may return "not found"
- Run this script soon after enabling webhooks to capture historical data

### Safe to Run Multiple Times

- The script checks both emails without delivery statuses and emails with batch send errors
- It's safe to run multiple times without duplicating data
- Subsequent runs will skip already-updated emails
- Emails that were incorrectly marked as failed will be corrected

## Troubleshooting

### "Email not found in Resend"

**Cause:** The email is older than Resend's retention period (typically 30 days)

**Solution:** This is expected for old emails. They've been logged but can't be backfilled.

### "No message ID (never sent)"

**Cause:** The email truly failed before reaching Resend (e.g., validation error, network issue before API call)

**Solution:** These emails genuinely failed and cannot be backfilled. Review the original error message to understand why they failed.

### Rate Limit Errors (429)

**Cause:** Resend's rate limit is 2 requests per second for the emails.get endpoint

**Solution:** The script now has proper rate limiting (600ms delay = ~1.67 req/s). If you modified the script and still see errors, ensure the delay is at least 500ms.

### "RESEND_API_KEY not found"

**Cause:** Missing or incorrect environment variable

**Solution:** 
1. Check your `.env` file in the `server` directory
2. Ensure `RESEND_API_KEY` is set correctly
3. Restart the script

## After Running

Once the backfill is complete:

1. **Check your Logs page** - You should see updated delivery statuses
2. **Webhooks will handle future emails** - New emails are tracked in real-time
3. **Run again if needed** - You can re-run to catch any missed emails

## Manual Verification

To verify the backfill worked, you can query your database:

```javascript
// Count emails with delivery status before backfill
db.sendlogs.countDocuments({ 
  resendMessageId: { $exists: true },
  deliveryStatus: { $exists: false }
})

// Should be 0 or very low after backfill

// Count opened emails
db.sendlogs.countDocuments({ 
  openedAt: { $exists: true }
})

// Count clicked emails
db.sendlogs.countDocuments({ 
  clickedAt: { $exists: true }
})
```

## Need Help?

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your Resend API key has permission to read emails
3. Ensure your MongoDB connection is stable
4. Check that emails were actually sent through Resend (have `resendMessageId`)

## Advanced Usage

### Filter by Date Range

To backfill only emails from a specific time period, modify the query in the script:

```typescript
const sendLogs = await SendLog.find({
  resendMessageId: { $exists: true, $ne: null },
  deliveryStatus: { $exists: false },
  createdAt: {
    $gte: new Date('2026-01-01'),
    $lte: new Date('2026-01-31')
  }
}).sort({ createdAt: -1 });
```

### Process Specific Campaign

To backfill only a specific campaign's emails:

```typescript
const sendLogs = await SendLog.find({
  campaignId: 'your-campaign-id-here',
  resendMessageId: { $exists: true, $ne: null },
  deliveryStatus: { $exists: false }
}).sort({ createdAt: -1 });
```

---

**Remember**: Once webhooks are properly configured (see [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md)), all future emails will be tracked automatically without needing to run this script again.
