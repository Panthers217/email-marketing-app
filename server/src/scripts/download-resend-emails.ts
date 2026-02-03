import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import { SendLog } from '../models/SendLog';

dotenv.config();

interface EmailRecord {
  id: string;
  to: string;
  from: string;
  subject: string;
  created_at: string;
  last_event: string;
  opened?: boolean;
  clicked?: boolean;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
}

async function downloadResendEmails() {
  try {
    console.log('📥 Downloading email data from Resend...\n');

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

    // Get all send logs with resendMessageId from our database
    const sendLogs = await SendLog.find({
      resendMessageId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });

    console.log(`📧 Found ${sendLogs.length} emails with Resend IDs in database\n`);

    if (sendLogs.length === 0) {
      console.log('No emails with Resend IDs found.');
      await mongoose.disconnect();
      return;
    }

    // Fetch detailed data from Resend for each email
    const allEmails: EmailRecord[] = [];
    let successCount = 0;
    let errorCount = 0;
    
    console.log('Fetching email details from Resend...');
    
    for (let i = 0; i < sendLogs.length; i++) {
      try {
        // Rate limiting: 2 requests per second
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }

        const log = sendLogs[i];
        const progress = `[${i + 1}/${sendLogs.length}]`;
        
        const emailData = await resend.emails.get(log.resendMessageId!);
        
        if (emailData?.data) {
          const email = emailData.data as any;
          allEmails.push({
            id: email.id || log.resendMessageId!,
            to: email.to || [log.recipientEmail],
            from: email.from || '',
            subject: email.subject || '',
            created_at: email.created_at || log.sentAt?.toISOString() || '',
            last_event: email.last_event || '',
            opened: email.opened,
            clicked: email.clicked,
            delivered_at: email.delivered_at,
            opened_at: email.opened_at,
            clicked_at: email.clicked_at,
            bounced_at: email.bounced_at,
            bounce_reason: email.bounce_reason
          });
          successCount++;
          
          if ((i + 1) % 10 === 0) {
            console.log(`  ${progress} Fetched ${successCount} emails...`);
          }
        }
      } catch (error: any) {
        errorCount++;
        if (error.statusCode !== 404) {
          console.log(`  Error fetching email ${i + 1}: ${error.message}`);
        }
      }
    }

    console.log(`\n✓ Successfully fetched: ${successCount}`);
    console.log(`✗ Errors/Not found: ${errorCount}\n`);

    if (allEmails.length === 0) {
      console.log('No emails were successfully fetched from Resend.');
      await mongoose.disconnect();
      return;
    }

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Export to JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(outputDir, `resend-emails-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(allEmails, null, 2));
    console.log(`✓ JSON exported to: ${jsonPath}`);

    // Export to CSV
    const csvPath = path.join(outputDir, `resend-emails-${timestamp}.csv`);
    const csvHeaders = 'ID,To,From,Subject,Created At,Last Event,Opened,Clicked,Delivered At,Opened At,Clicked At,Bounced At,Bounce Reason\n';
    const csvRows = allEmails.map(email => {
      const to = Array.isArray(email.to) ? email.to.join(';') : email.to;
      const subject = (email.subject || '').replace(/"/g, '""'); // Escape quotes
      const bounceReason = (email.bounce_reason || '').replace(/"/g, '""');
      return `"${email.id}","${to}","${email.from}","${subject}","${email.created_at}","${email.last_event || 'N/A'}","${email.opened || false}","${email.clicked || false}","${email.delivered_at || ''}","${email.opened_at || ''}","${email.clicked_at || ''}","${email.bounced_at || ''}","${bounceReason}"`;
    }).join('\n');
    fs.writeFileSync(csvPath, csvHeaders + csvRows);
    console.log(`✓ CSV exported to: ${csvPath}`);

    // Print summary statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`Total emails: ${allEmails.length}`);
    
    // Count by last_event
    const eventCounts: { [key: string]: number } = {};
    let openedCount = 0;
    let clickedCount = 0;
    
    allEmails.forEach(email => {
      const event = email.last_event || 'unknown';
      eventCounts[event] = (eventCounts[event] || 0) + 1;
      if (email.opened) openedCount++;
      if (email.clicked) clickedCount++;
    });
    
    console.log('\nBy Status:');
    Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).forEach(([event, count]) => {
      console.log(`  ${event}: ${count}`);
    });
    
    console.log('\nEngagement:');
    console.log(`  Opened: ${openedCount} (${((openedCount/allEmails.length) * 100).toFixed(1)}%)`);
    console.log(`  Clicked: ${clickedCount} (${((clickedCount/allEmails.length) * 100).toFixed(1)}%)`);
    
    // Show date range
    if (allEmails.length > 0) {
      const dates = allEmails.map(e => new Date(e.created_at).getTime()).sort();
      const oldest = new Date(dates[0]);
      const newest = new Date(dates[dates.length - 1]);
      console.log(`\nDate Range:`);
      console.log(`  Oldest: ${oldest.toLocaleString()}`);
      console.log(`  Newest: ${newest.toLocaleString()}`);
    }
    
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

// Run the script
downloadResendEmails()
  .then(() => {
    console.log('\n✅ Download complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Download failed:', error);
    process.exit(1);
  });
