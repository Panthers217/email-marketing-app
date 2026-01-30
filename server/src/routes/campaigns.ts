import { Router, Response } from 'express';
import { z } from 'zod';
import { Resend } from 'resend';
import pLimit from 'p-limit';
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
  const limit = pLimit(5); // Concurrency limit

  const promises = recipients.map((recipient) =>
    limit(async () => {
      const log = await SendLog.create({
        campaignId,
        recipientId: recipient._id,
        recipientEmail: recipient.email,
        status: 'queued',
      });

      try {
        // Personalize email
        let personalizedHtml = htmlBody;
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

        const result = await resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          to: recipient.email,
          subject,
          html: personalizedHtml,
        });

        const sentDate = new Date();
        await SendLog.findByIdAndUpdate(log._id, {
          status: 'sent',
          resendMessageId: result.data?.id,
          sentAt: sentDate,
        });

        // Update recipient with sent time and date
        await Recipient.findByIdAndUpdate(recipient._id, {
          time: sentDate.toLocaleTimeString('en-US', { hour12: false }),
          date: sentDate,
        });
      } catch (error: any) {
        // Retry once
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const result = await resend.emails.send({
            from: `${senderName} <${senderEmail}>`,
            to: recipient.email,
            subject,
            html: htmlBody,
          });

          const sentDate = new Date();
          await SendLog.findByIdAndUpdate(log._id, {
            status: 'sent',
            resendMessageId: result.data?.id,
            sentAt: sentDate,
          });

          // Update recipient with sent time and date
          await Recipient.findByIdAndUpdate(recipient._id, {
            time: sentDate.toLocaleTimeString('en-US', { hour12: false }),
            date: sentDate,
          });
        } catch (retryError: any) {
          await SendLog.findByIdAndUpdate(log._id, {
            status: 'failed',
            errorMessage: retryError.message,
          });
        }
      }
    })
  );

  await Promise.all(promises);
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
