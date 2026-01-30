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
});

const sendCampaignSchema = z.object({
  tags: z.array(z.string()).optional(),
  sendToAll: z.boolean().optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = campaignSchema.parse(req.body);

    const campaign = await Campaign.create({
      name: data.name,
      subject: data.subject,
      htmlBody: data.htmlBody,
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
    const { tags, sendToAll } = sendCampaignSchema.parse(req.body);
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get recipients
    const filter: any = {};
    if (!sendToAll && tags && tags.length > 0) {
      filter.tags = { $in: tags };
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

    // Start sending process (don't wait for completion)
    res.json({
      success: true,
      message: `Sending to ${recipients.length} recipients`,
      recipientCount: recipients.length,
    });

    // Send emails asynchronously
    sendEmails(campaign._id.toString(), recipients, apiKey, senderEmail, senderName, campaign.subject, campaign.htmlBody);
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
  htmlBody: string
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

        const result = await resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          to: recipient.email,
          subject,
          html: personalizedHtml,
        });

        await SendLog.findByIdAndUpdate(log._id, {
          status: 'sent',
          resendMessageId: result.data?.id,
          sentAt: new Date(),
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

          await SendLog.findByIdAndUpdate(log._id, {
            status: 'sent',
            resendMessageId: result.data?.id,
            sentAt: new Date(),
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

export default router;
