import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { SendLog } from '../models/SendLog';

const router = Router();

// Webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    return false;
  }
}

// Resend webhook endpoint
router.post('/resend', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['resend-signature'] as string;
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const payload = JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const event = req.body;
    console.log('Received Resend webhook:', event.type);

    // Extract email ID from the event
    const emailId = event.data?.email_id || event.data?.id;
    
    if (!emailId) {
      console.error('No email ID in webhook event:', event);
      res.status(400).json({ error: 'No email ID provided' });
      return;
    }

    // Find the send log by Resend message ID
    const sendLog = await SendLog.findOne({ resendMessageId: emailId });
    
    if (!sendLog) {
      console.log(`No send log found for email ID: ${emailId}`);
      res.status(404).json({ error: 'Send log not found' });
      return;
    }

    const now = new Date();
    const webhookEvent = {
      type: event.type,
      timestamp: now,
      data: event.data,
    };

    // Update send log based on event type
    switch (event.type) {
      case 'email.delivered':
        await SendLog.findByIdAndUpdate(sendLog._id, {
          deliveryStatus: 'delivered',
          deliveredAt: now,
          $push: { webhookEvents: webhookEvent },
        });
        console.log(`✓ Email delivered: ${sendLog.recipientEmail}`);
        break;

      case 'email.bounced':
        const bounceReason = event.data?.bounce?.reason || 'Unknown bounce reason';
        await SendLog.findByIdAndUpdate(sendLog._id, {
          deliveryStatus: 'bounced',
          bouncedAt: now,
          bounceReason: bounceReason,
          $push: { webhookEvents: webhookEvent },
        });
        console.log(`✗ Email bounced: ${sendLog.recipientEmail} - ${bounceReason}`);
        break;

      case 'email.complained':
        await SendLog.findByIdAndUpdate(sendLog._id, {
          deliveryStatus: 'complained',
          complainedAt: now,
          $push: { webhookEvents: webhookEvent },
        });
        console.log(`⚠ Email complained: ${sendLog.recipientEmail}`);
        break;

      case 'email.opened':
        await SendLog.findByIdAndUpdate(sendLog._id, {
          openedAt: now,
          $push: { webhookEvents: webhookEvent },
        });
        console.log(`📖 Email opened: ${sendLog.recipientEmail}`);
        break;

      case 'email.clicked':
        await SendLog.findByIdAndUpdate(sendLog._id, {
          clickedAt: now,
          $push: { webhookEvents: webhookEvent },
        });
        console.log(`🔗 Email clicked: ${sendLog.recipientEmail}`);
        break;

      default:
        console.log(`Unknown webhook event type: ${event.type}`);
        // Still store the event for debugging
        await SendLog.findByIdAndUpdate(sendLog._id, {
          $push: { webhookEvents: webhookEvent },
        });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
