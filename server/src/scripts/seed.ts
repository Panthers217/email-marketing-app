import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { WorkspaceSettings } from '../models/WorkspaceSettings';
import { encrypt } from '../utils/encryption';

dotenv.config();

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/email-marketing';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create initial workspace settings
    const existing = await WorkspaceSettings.findOne();
    
    if (existing) {
      console.log('Workspace settings already exist');
      process.exit(0);
    }

    const secretKey = process.env.APP_SECRET_KEY!;
    const resendKey = process.env.RESEND_API_KEY;
    const mongoUriFromEnv = process.env.MONGODB_URI;

    const settings = await WorkspaceSettings.create({
      companyName: 'My Company',
      senderName: 'My Company',
      senderEmail: 'noreply@example.com',
      encryptedResendApiKey: resendKey ? encrypt(resendKey, secretKey) : undefined,
      encryptedMongoUri: mongoUriFromEnv ? encrypt(mongoUriFromEnv, secretKey) : undefined,
    });

    console.log('✓ Workspace settings created:', settings.companyName);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
