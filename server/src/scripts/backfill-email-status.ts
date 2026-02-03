import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Resend } from 'resend';
import { SendLog } from '../models/SendLog';

dotenv.config();

interface ResendEmailData {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  last_event: string; // 'delivered', 'bounced', 'opened', 'clicked', etc.
  // Additional fields based on Resend API
  opened?: boolean;
  clicked?: boolean;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
}

async function backfillEmailStatuses() {
  try {
    console.log('🔄 Starting email status backfill...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Initialize Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not found in environment variables');
    }
    const resend = new Resend(apiKey);
    console.log('✓ Initialized Resend client\n');

    // Find all send logs that need to be checked:
    // 1. Have resendMessageId but no delivery status (webhooks not set up yet)
    // 2. Have failed status with batch send errors (might have actually sent)
    const sendLogs = await SendLog.find({
      $or: [
        // Emails with resendMessageId but no delivery status
        {
          resendMessageId: { $exists: true, $ne: null },
          $or: [
            { deliveryStatus: { $exists: false } },
            { deliveryStatus: null }
          ]
        },
        // Emails that failed with batch-related errors
        {
          status: 'failed',
          errorMessage: {
            $in: [
              'Unknown response from batch send',
              'Failed in batch send',
              'No data returned from batch send',
              'Batch send failed'
            ]
          }
        }
      ]
    }).sort({ createdAt: -1 });

    console.log(`📧 Found ${sendLogs.length} emails to check\n`);

    if (sendLogs.length === 0) {
      console.log('No emails to process. Exiting.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    let updatedCount = 0;
    let noMessageIdCount = 0;

    // Process each send log
    for (let i = 0; i < sendLogs.length; i++) {
      const log = sendLogs[i];
      const progress = `[${i + 1}/${sendLogs.length}]`;

      try {
        // Skip if no resendMessageId (truly failed before sending)
        if (!log.resendMessageId) {
          console.log(`${progress} Skipping ${log.recipientEmail} - no message ID (never sent to Resend)`);
          noMessageIdCount++;
          continue;
        }

        console.log(`${progress} Checking email ${log.resendMessageId} (${log.recipientEmail})...`);

        // Fetch email data from Resend
        const emailData = await resend.emails.get(log.resendMessageId!);
        
        if (!emailData || !emailData.data) {
          console.log(`  ⚠️  Email not found in Resend`);
          notFoundCount++;
          continue;
        }

        const email = emailData.data as any;
        let updated = false;
        const updateFields: any = {};

        // If this was marked as failed but we found it in Resend, it was actually sent
        if (log.status === 'failed') {
          updateFields.status = 'sent';
          updateFields.errorMessage = null;
          if (email.created_at) {
            updateFields.sentAt = new Date(email.created_at);
          }
          updated = true;
          console.log(`  ✓ Actually sent (was incorrectly marked as failed)`);
        }

        // Check delivery status
        if (email.last_event) {
          const lastEvent = email.last_event.toLowerCase();
          
          switch (lastEvent) {
            case 'delivered':
              updateFields.deliveryStatus = 'delivered';
              if (email.delivered_at) {
                updateFields.deliveredAt = new Date(email.delivered_at);
              }
              updated = true;
              console.log(`  ✓ Delivered`);
              break;

            case 'bounced':
              updateFields.deliveryStatus = 'bounced';
              if (email.bounced_at) {
                updateFields.bouncedAt = new Date(email.bounced_at);
              }
              if (email.bounce_reason) {
                updateFields.bounceReason = email.bounce_reason;
              }
              updated = true;
              console.log(`  ✗ Bounced: ${email.bounce_reason || 'Unknown reason'}`);
              break;

            case 'complained':
              updateFields.deliveryStatus = 'complained';
              if (email.complained_at) {
                updateFields.complainedAt = new Date(email.complained_at);
              }
              updated = true;
              console.log(`  ⚠️  Complained`);
              break;
          }
        }

        // Check if email was opened
        if (email.opened_at || email.opened === true) {
          updateFields.openedAt = email.opened_at ? new Date(email.opened_at) : log.sentAt;
          updated = true;
          console.log(`  📖 Opened`);
        }

        // Check if email was clicked
        if (email.clicked_at || email.clicked === true) {
          updateFields.clickedAt = email.clicked_at ? new Date(email.clicked_at) : log.sentAt;
          updated = true;
          console.log(`  🔗 Clicked`);
        }

        // Update the send log if we found any new information
        if (updated) {
          await SendLog.findByIdAndUpdate(log._id, updateFields);
          updatedCount++;
          console.log(`  ✅ Updated`);
        } else {
          console.log(`  ℹ️  No updates needed`);
        }

        successCount++;

        // Rate limiting: Resend allows 2 requests per second for emails.get endpoint
        // Use 600ms delay to be safe (allowing ~1.67 requests/second)
        if (i < sendLogs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }

      } catch (error: any) {
        errorCount++;
        if (error.statusCode === 404) {
          console.log(`  ⚠️  Email not found in Resend (might be too old)`);
          notFoundCount++;
        } else {
          console.error(`  ❌ Error: ${error.message}`);
        }
      }

      // Add a newline for readability every 10 emails
      if ((i + 1) % 10 === 0) {
        console.log('');
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Backfill Summary');
    console.log('='.repeat(60));
    console.log(`Total emails processed: ${sendLogs.length}`);
    console.log(`✓ Successfully checked: ${successCount}`);
    console.log(`✓ Updated with new data: ${updatedCount}`);
    console.log(`⚠️  Not found in Resend: ${notFoundCount}`);
    console.log(`⚠️  No message ID (never sent): ${noMessageIdCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the script
backfillEmailStatuses()
  .then(() => {
    console.log('\n✅ Backfill complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  });
