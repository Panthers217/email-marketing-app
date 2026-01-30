import { Router, Response } from 'express';
import { z } from 'zod';
import { Resend } from 'resend';
import mongoose from 'mongoose';
import { WorkspaceSettings } from '../models/WorkspaceSettings';
import { encrypt, decrypt } from '../utils/encryption';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const settingsSchema = z.object({
  companyName: z.string().min(1),
  senderName: z.string().min(1),
  senderEmail: z.string().email(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  resendApiKey: z.string().optional(),
  mongoUri: z.string().optional(),
});

const testResendSchema = z.object({
  testEmail: z.string().email(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await WorkspaceSettings.findOne();

    if (!settings) {
      res.json({
        exists: false,
        resendConnected: !!process.env.RESEND_API_KEY,
        mongoConnected: !!process.env.MONGODB_URI,
      });
      return;
    }

    res.json({
      exists: true,
      companyName: settings.companyName,
      senderName: settings.senderName,
      senderEmail: settings.senderEmail,
      logoUrl: settings.logoUrl || '',
      websiteUrl: settings.websiteUrl || '',
      resendConnected: !!settings.encryptedResendApiKey || !!process.env.RESEND_API_KEY,
      mongoConnected: !!settings.encryptedMongoUri || !!process.env.MONGODB_URI,
    });
  } catch (error) {
    throw error;
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = settingsSchema.parse(req.body);
    const secretKey = process.env.APP_SECRET_KEY!;

    const updateData: any = {
      companyName: data.companyName,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      logoUrl: data.logoUrl || '',
      websiteUrl: data.websiteUrl || '',
    };

    if (data.resendApiKey) {
      updateData.encryptedResendApiKey = encrypt(data.resendApiKey, secretKey);
    }

    if (data.mongoUri) {
      updateData.encryptedMongoUri = encrypt(data.mongoUri, secretKey);
    }

    const settings = await WorkspaceSettings.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      companyName: settings.companyName,
      senderName: settings.senderName,
      senderEmail: settings.senderEmail,
      logoUrl: settings.logoUrl,
      websiteUrl: settings.websiteUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
});

router.post('/test-resend', async (req: AuthRequest, res: Response) => {
  try {
    const { testEmail } = testResendSchema.parse(req.body);
    const secretKey = process.env.APP_SECRET_KEY!;

    let apiKey = process.env.RESEND_API_KEY;
    const settings = await WorkspaceSettings.findOne();

    if (settings?.encryptedResendApiKey) {
      apiKey = decrypt(settings.encryptedResendApiKey, secretKey);
    }

    if (!apiKey) {
      throw new AppError('Resend API key not configured', 400);
    }

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: settings?.senderEmail || 'test@example.com',
      to: testEmail,
      subject: 'Test Email from Email Marketing App',
      html: '<p>This is a test email. Your Resend connection is working!</p>',
    });

    res.json({
      success: true,
      messageId: result.data?.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send test email',
    });
  }
});

router.post('/test-mongo', async (req: AuthRequest, res: Response) => {
  try {
    const secretKey = process.env.APP_SECRET_KEY!;
    let mongoUri = process.env.MONGODB_URI;
    const settings = await WorkspaceSettings.findOne();

    if (settings?.encryptedMongoUri) {
      mongoUri = decrypt(settings.encryptedMongoUri, secretKey);
    }

    if (!mongoUri) {
      throw new AppError('MongoDB URI not configured', 400);
    }

    // Test connection
    const testConnection = await mongoose.createConnection(mongoUri).asPromise();
    await testConnection.close();

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to connect to MongoDB',
    });
  }
});

export default router;
