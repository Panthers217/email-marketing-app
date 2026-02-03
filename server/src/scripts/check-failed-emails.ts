import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { SendLog } from '../models/SendLog';

dotenv.config();

async function checkFailedEmails() {
  try {
    console.log('🔍 Checking failed emails...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Find failed emails with batch-related errors
    const failedEmails = await SendLog.find({
      status: 'failed',
      errorMessage: {
        $in: [
          'Unknown response from batch send',
          'Failed in batch send',
          'No data returned from batch send',
          'Batch send failed'
        ]
      }
    }).limit(50);

    console.log(`📧 Found ${failedEmails.length} failed emails with batch errors\n`);

    let withMessageId = 0;
    let withoutMessageId = 0;

    failedEmails.forEach((email, idx) => {
      console.log(`[${idx + 1}] Email: ${email.recipientEmail}`);
      console.log(`    Status: ${email.status}`);
      console.log(`    Error: ${email.errorMessage}`);
      console.log(`    Has resendMessageId: ${email.resendMessageId ? 'YES - ' + email.resendMessageId : 'NO'}`);
      console.log(`    Created: ${email.createdAt}`);
      console.log('');

      if (email.resendMessageId) {
        withMessageId++;
      } else {
        withoutMessageId++;
      }
    });

    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`✓ With resendMessageId: ${withMessageId}`);
    console.log(`✗ Without resendMessageId: ${withoutMessageId}`);
    console.log('='.repeat(60));

    if (withoutMessageId > 0) {
      console.log('\n⚠️  Emails without resendMessageId cannot be backfilled.');
      console.log('   These emails never reached Resend\'s API successfully.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

checkFailedEmails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
