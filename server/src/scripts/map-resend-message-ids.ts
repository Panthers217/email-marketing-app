import mongoose from 'mongoose';
import { Recipient } from '../models/Recipient';
import { SendLog } from '../models/SendLog';
import dotenv from 'dotenv';

dotenv.config();

// Mapping of church emails to their ResendMessageIds
const emailToMessageIdMap: Record<string, string> = {
  'associate@newberncog.net': 'e32b7677-91b8-440c-99c2-e3151e3a4de6',
  'office@newlifenewbern.com': '698f39be-3ccc-4ce7-be6f-9f5b698fec99',
  'info@wlcconline.com': '41fe620d-978b-4bc6-8978-0600781c99be',
  'nbcrossroads@hotmail.com': 'e7a945f6-cbbe-4e0c-aa14-ded6a7d571f1',
  'familyofgodcc.office@gmail.com': 'bd0b1b47-e4d8-4ddb-b63b-86b90be8bfb5',
  'secretary@northwoodsumc.org': '1dec3966-8285-4231-8202-aeea5a496ff1',
  'nbccjaxnc@gmail.com': 'e183f7f4-103c-4785-b3a4-9ea5e9f3f8f8',
  'info@jnccog.org': 'b55d069c-043d-41ed-993d-4dd55b55d066',
  'contact@pillarjax.com': '6011a0be-6da7-49cb-a61c-c763afd1924f',
  'thesojleadership@gmail.com': 'f03a7549-9406-462c-9c76-b96251421060',
  'dimas@livinghopejacksonville.org': 'e4458020-7b22-49a8-995a-9e7290a26c2b',
  '126centerstreet@gmail.com': '5699d008-b5b5-4ad8-9159-b5be5dc31375',
  'info@bluecreekbaptist.com': '7244b2f5-cf79-4173-826e-b7bd7b371fb9',
  'info@restorejax.church': '1082f94e-8b2c-45b5-aff6-0835140d1b4d',
  'ntccjax@gmail.com': '731dfac1-0447-4df8-82eb-743a45ac1dd6',
  'info@thedoorjnc.com': '28140fa6-e38a-426a-8791-6b4f6b5cb347',
  'office@discovery-church.net': 'dcfed780-f7c9-4542-a5dc-2b3c43665056',
  'info@ccjnc.org': 'e8163878-d9b9-45ca-b324-0b3a8af7344c',
  'albc@embarqmail.com': '16386995-1c6f-4051-a3e9-f86f35e9e1a9',
  'thechurchatonslow@gmail.com': 'dc357b0d-e131-4ea2-8106-ce38bf6efced',
  'info@catalystchurch.com': '4159dbd4-c803-45e0-a7cb-bf8fd5f9b5d6',
  'trinitychurchhvlnc@embarqmail.com': '7d875dca-9d05-42c4-8286-6d0fa5562af6',
  'office@fbchurch.com': 'bbefa431-24f8-4bac-8038-584cd42f5c67',
  'temple@temple.church': 'f9b50d83-c2ad-4904-8f02-89791a14c3f4',
  'info@tworiverschurch.com': 'e7a9a8a6-ed2a-4757-a596-12b4ea186436',
  'centenaryumc@centenarychurch.com': '95f895e3-80b3-4d28-8f54-f7f3672149b5',
  'welcome@spccnb.org': 'eea6f80d-d6de-4a05-8078-fe1534a12e2d',
  'havcommbc@gmail.com': '46c5f669-52e1-4c72-a547-60d6fd030610',
  'oceanfamilychurch@gmail.com': '98b00674-b286-4049-aa4b-8d292de31b88',
  'welcomedesk@fbcswansboro.org': '1c446c0d-b4eb-40a8-bdf1-6ef5e487c7a5',
  'emmanuelbaptistnc@gmail.com': 'f303571c-ef60-426e-9fe1-d091fd426d3a',
  'swansborochurchofchrist@gmail.com': '710e9bf3-87f3-428d-bc55-161848a375b1',
  'office@ccbcnow.com': '5682e3e6-d4c9-40dc-82fe-91735a2ae3c7',
  'info@firstmethodist.life': '76730130-5c64-477d-b0de-a67895590eec',
  'office@southbankschurch.com': 'eb893d4d-c9de-4462-a471-5fc0d79b7978',
  'capecarteretpres@gmail.com': 'bc8c1f85-af65-42ef-8c01-ffb5a263d249',
};

async function mapResendMessageIds() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let totalUpdated = 0;
    let totalNotFound = 0;
    let totalAlreadyHasMessageId = 0;
    const notFoundEmails: string[] = [];

    for (const [email, resendMessageId] of Object.entries(emailToMessageIdMap)) {
      const normalizedEmail = email.toLowerCase();
      
      // Find the recipient
      const recipient = await Recipient.findOne({ email: normalizedEmail });
      
      if (!recipient) {
        console.log(`⚠️  Recipient not found: ${email}`);
        notFoundEmails.push(email);
        totalNotFound++;
        continue;
      }

      // Find send logs for this recipient that don't have a resendMessageId
      const logs = await SendLog.find({
        recipientId: recipient._id,
        $or: [
          { resendMessageId: { $exists: false } },
          { resendMessageId: null },
          { resendMessageId: '' }
        ]
      });

      if (logs.length === 0) {
        // Check if logs exist with messageId already set
        const logsWithMessageId = await SendLog.find({
          recipientId: recipient._id,
          resendMessageId: { $exists: true, $ne: null, $ne: '' }
        });
        
        if (logsWithMessageId.length > 0) {
          console.log(`ℹ️  ${email}: Already has ResendMessageId (${logsWithMessageId.length} logs)`);
          totalAlreadyHasMessageId++;
        } else {
          console.log(`ℹ️  ${email}: No send logs found`);
        }
        continue;
      }

      // Update all logs for this recipient
      const result = await SendLog.updateMany(
        {
          recipientId: recipient._id,
          $or: [
            { resendMessageId: { $exists: false } },
            { resendMessageId: null },
            { resendMessageId: '' }
          ]
        },
        {
          $set: { resendMessageId: resendMessageId }
        }
      );

      console.log(`✅ ${email}: Updated ${result.modifiedCount} log(s) with ResendMessageId: ${resendMessageId}`);
      totalUpdated += result.modifiedCount;
    }

    console.log('\n📊 Summary:');
    console.log(`   Total logs updated: ${totalUpdated}`);
    console.log(`   Recipients already had MessageId: ${totalAlreadyHasMessageId}`);
    console.log(`   Recipients not found in database: ${totalNotFound}`);
    
    if (notFoundEmails.length > 0) {
      console.log('\n❌ Not found emails:');
      notFoundEmails.forEach(email => console.log(`   - ${email}`));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

mapResendMessageIds()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
