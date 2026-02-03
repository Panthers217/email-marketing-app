import { Router, Response } from 'express';
import { z } from 'zod';
import { Resend } from 'resend';
import { Campaign } from '../models/Campaign';
import { Recipient } from '../models/Recipient';
import { SendLog } from '../models/SendLog';
import { WorkspaceSettings } from '../models/WorkspaceSettings';
import { decrypt } from '../utils/encryption';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const campaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlBody: z.string().min(1),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

const sendCampaignSchema = z.object({
  tags: z.array(z.string()).optional(),
  sendToAll: z.boolean().optional(),
  recipientIds: z.array(z.string()).optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = campaignSchema.parse(req.body);

    const campaign = await Campaign.create({
      name: data.name,
      subject: data.subject,
      htmlBody: data.htmlBody,
      websiteUrl: data.websiteUrl || undefined,
      logoUrl: data.logoUrl || undefined,
    });

    res.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    throw error;
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json(campaign);
  } catch (error) {
    throw error;
  }
});

router.get('/:id/send-status', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Check if campaign has any send logs
    const sendLogCount = await SendLog.countDocuments({ campaignId: req.params.id });
    const sentCount = await SendLog.countDocuments({ campaignId: req.params.id, status: 'sent' });

    res.json({
      hasBeenSent: sendLogCount > 0,
      totalSends: sendLogCount,
      successfulSends: sentCount,
    });
  } catch (error) {
    throw error;
  }
});

router.get('/:id/previous-recipients', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get all recipients that were successfully sent this campaign
    const sendLogs = await SendLog.find({
      campaignId: req.params.id,
      status: 'sent'
    }).populate('recipientId').distinct('recipientId');

    res.json(sendLogs);
  } catch (error) {
    throw error;
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = campaignSchema.parse(req.body);

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        name: data.name,
        subject: data.subject,
        htmlBody: data.htmlBody,
        websiteUrl: data.websiteUrl || undefined,
        logoUrl: data.logoUrl || undefined,
      },
      { new: true }
    );

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
});

router.post('/:id/send', async (req: AuthRequest, res: Response) => {
  try {
    const { tags, sendToAll, recipientIds } = sendCampaignSchema.parse(req.body);
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get recipients
    const filter: any = {};
    
    if (sendToAll) {
      // Send to all recipients
    } else if (recipientIds && recipientIds.length > 0) {
      // Send to specific recipients by ID
      filter._id = { $in: recipientIds };
    } else if (tags && tags.length > 0) {
      // Send to recipients by tags (backward compatibility)
      filter.tags = { $in: tags };
    } else {
      res.status(400).json({ error: 'Must specify recipients or sendToAll' });
      return;
    }

    const recipients = await Recipient.find(filter);

    if (recipients.length === 0) {
      res.status(400).json({ error: 'No recipients found' });
      return;
    }

    // Get Resend API key
    const secretKey = process.env.APP_SECRET_KEY!;
    let apiKey = process.env.RESEND_API_KEY;
    const settings = await WorkspaceSettings.findOne();

    if (settings?.encryptedResendApiKey) {
      apiKey = decrypt(settings.encryptedResendApiKey, secretKey);
    }

    if (!apiKey) {
      throw new AppError('Resend API key not configured', 400);
    }

    const senderEmail = settings?.senderEmail || 'noreply@example.com';
    const senderName = settings?.senderName || 'Email Marketing';

    // Determine logo and website URLs - use campaign-specific or fallback to workspace settings
    const finalLogoUrl = campaign.logoUrl || settings?.logoUrl || '';
    const finalWebsiteUrl = campaign.websiteUrl || settings?.websiteUrl || '';

    // Start sending process (don't wait for completion)
    res.json({
      success: true,
      message: `Sending to ${recipients.length} recipients`,
      recipientCount: recipients.length,
    });

    // Send emails asynchronously
    sendEmails(campaign._id.toString(), recipients, apiKey, senderEmail, senderName, campaign.subject, campaign.htmlBody, finalLogoUrl, finalWebsiteUrl);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
});

// Helper function to personalize HTML for a recipient
function personalizeHtml(
  htmlBody: string,
  recipient: any,
  logoUrl?: string,
  websiteUrl?: string
): string {
  let personalizedHtml = htmlBody;

  // Replace personalization tokens
  if (recipient.name) {
    personalizedHtml = personalizedHtml.replace(/\{\{name\}\}/g, recipient.name);
  }
  personalizedHtml = personalizedHtml.replace(/\{\{email\}\}/g, recipient.email);
  if (recipient.city) {
    personalizedHtml = personalizedHtml.replace(/\{\{city\}\}/g, recipient.city);
  }
  if (recipient.county) {
    personalizedHtml = personalizedHtml.replace(/\{\{county\}\}/g, recipient.county);
  }
  if (recipient.subject) {
    personalizedHtml = personalizedHtml.replace(/\{\{subject\}\}/g, recipient.subject);
  }
  if (recipient.time) {
    personalizedHtml = personalizedHtml.replace(/\{\{time\}\}/g, recipient.time);
  }
  if (recipient.date) {
    personalizedHtml = personalizedHtml.replace(/\{\{date\}\}/g, recipient.date.toLocaleDateString());
  }

  // Inject logo at the top if logoUrl exists
  if (logoUrl) {
    const logoHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoUrl}" alt="Logo" style="width: 300px; height: 200px; object-fit: contain;" /></div>`;
    const bodyMatch = personalizedHtml.match(/<body[^>]*>/i);
    if (bodyMatch) {
      personalizedHtml = personalizedHtml.replace(bodyMatch[0], bodyMatch[0] + logoHtml);
    } else {
      personalizedHtml = logoHtml + personalizedHtml;
    }
  }

  // Append website URL at the bottom if websiteUrl exists
  if (websiteUrl) {
    const websiteHtml = `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;"><p>Visit our website: <a href="${websiteUrl}" style="color: #3b82f6; text-decoration: underline;">${websiteUrl}</a></p></div>`;
    const bodyEndMatch = personalizedHtml.match(/<\/body>/i);
    if (bodyEndMatch) {
      personalizedHtml = personalizedHtml.replace(bodyEndMatch[0], websiteHtml + bodyEndMatch[0]);
    } else {
      personalizedHtml = personalizedHtml + websiteHtml;
    }
  }

  return personalizedHtml;
}

// Helper function to chunk array into smaller arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper function for exponential backoff retry
async function sendBatchWithRetry(
  resend: Resend,
  batch: any[],
  maxRetries = 3
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await resend.batch.send(batch);
      return result;
    } catch (error: any) {
      const isRateLimitError = error.statusCode === 429 || error.message?.includes('rate limit');
      const isLastAttempt = attempt === maxRetries - 1;

      if (isRateLimitError && !isLastAttempt) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
}

async function sendEmails(
  campaignId: string,
  recipients: any[],
  apiKey: string,
  senderEmail: string,
  senderName: string,
  subject: string,
  htmlBody: string,
  logoUrl?: string,
  websiteUrl?: string
) {
  const resend = new Resend(apiKey);
  const BATCH_SIZE = 100; // Resend's max batch size
  const BATCH_DELAY = 1000; // 1 second delay between batches to respect rate limits

  // Split recipients into batches of 100
  const batches = chunkArray(recipients, BATCH_SIZE);
  console.log(`Sending to ${recipients.length} recipients in ${batches.length} batches`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

    // Create send logs for this batch
    const logsMap = new Map<string, string>(); // Map email to log ID
    for (const recipient of batch) {
      const log = await SendLog.create({
        campaignId,
        recipientId: recipient._id,
        recipientEmail: recipient.email,
        status: 'queued',
      });
      logsMap.set(recipient.email, log._id.toString());
    }

    try {
      // Prepare batch payload with personalized content
      const batchPayload = batch.map((recipient) => ({
        from: `${senderName} <${senderEmail}>`,
        to: recipient.email,
        subject: subject,
        html: personalizeHtml(htmlBody, recipient, logoUrl, websiteUrl),
        tags: [
          { name: 'campaign_id', value: campaignId },
          { name: 'recipient_type', value: recipient.type || 'church' },
        ],
        // Enable tracking for opens and clicks
        headers: {
          'X-Entity-Ref-ID': campaignId,
        },
      }));

      // Send batch with retry logic
      const result = await sendBatchWithRetry(resend, batchPayload);
      const sentDate = new Date();

      console.log(`Batch ${batchIndex + 1} result:`, JSON.stringify(result, null, 2));

      // Update send logs and recipients based on batch response
      // Note: Resend batch API returns double-nested: result.data.data
      const batchResults = result?.data?.data;
      
      if (batchResults && Array.isArray(batchResults)) {
        for (let i = 0; i < batch.length; i++) {
          const recipient = batch[i];
          const emailResult = batchResults[i];
          const logId = logsMap.get(recipient.email);

          if (emailResult && emailResult.id) {
            // Email sent successfully
            console.log(`✓ Email sent to ${recipient.email}, ID: ${emailResult.id}`);
            await SendLog.findByIdAndUpdate(logId, {
              status: 'sent',
              resendMessageId: emailResult.id,
              sentAt: sentDate,
            });

            // Update recipient with sent time and date
            await Recipient.findByIdAndUpdate(recipient._id, {
              time: sentDate.toLocaleTimeString('en-US', { hour12: false }),
              date: sentDate,
            });
          } else if (emailResult && emailResult.error) {
            // Email failed with error in batch response
            const errorMsg = emailResult.error.message || JSON.stringify(emailResult.error);
            console.log(`✗ Email failed for ${recipient.email}: ${errorMsg}`);
            await SendLog.findByIdAndUpdate(logId, {
              status: 'failed',
              errorMessage: errorMsg,
            });
          } else {
            // Unknown response format
            console.log(`? Unknown result for ${recipient.email}:`, emailResult);
            await SendLog.findByIdAndUpdate(logId, {
              status: 'failed',
              errorMessage: 'Unknown response from batch send',
            });
          }
        }
      } else {
        // No data in response - mark all as failed
        console.error(`Batch ${batchIndex + 1} returned no data. Full result:`, result);
        for (const recipient of batch) {
          const logId = logsMap.get(recipient.email);
          await SendLog.findByIdAndUpdate(logId, {
            status: 'failed',
            errorMessage: 'No data returned from batch send',
          });
        }
      }

      console.log(`Batch ${batchIndex + 1} completed`);
    } catch (error: any) {
      console.error(`Batch ${batchIndex + 1} failed:`, error.message);

      // Mark all emails in this batch as failed
      for (const recipient of batch) {
        const logId = logsMap.get(recipient.email);
        await SendLog.findByIdAndUpdate(logId, {
          status: 'failed',
          errorMessage: error.message || 'Batch send failed',
        });
      }
    }

    // Add delay between batches to respect rate limits (except after last batch)
    if (batchIndex < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`Campaign ${campaignId} sending completed`);
}

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Optionally delete associated logs
    await SendLog.deleteMany({ campaignId: req.params.id });

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    throw error;
  }
});

export default router;
