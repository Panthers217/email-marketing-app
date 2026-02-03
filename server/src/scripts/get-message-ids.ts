// Quick script to get message IDs from the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SendLog } from './models/SendLog';

dotenv.config();

async function getMessageIds() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/email-marketing';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const logs = await SendLog.find({ resendMessageId: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('recipientEmail resendMessageId status createdAt');

    if (logs.length === 0) {
      console.log('\n❌ No emails sent yet!');
      console.log('👉 Send a campaign first, then run this script again.\n');
    } else {
      console.log('\n📧 Recent sent emails:\n');
      logs.forEach((log, i) => {
        console.log(`${i + 1}. ${log.recipientEmail}`);
        console.log(`   Message ID: ${log.resendMessageId}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Sent: ${log.createdAt}\n`);
      });

      const firstId = logs[0].resendMessageId;
      console.log('💡 Test webhook with this command:\n');
      console.log(`curl http://localhost:3001/api/webhooks/resend \\`);
      console.log(`  -X POST \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"type":"email.delivered","data":{"email_id":"${firstId}"}}'`);
      console.log('');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getMessageIds();
