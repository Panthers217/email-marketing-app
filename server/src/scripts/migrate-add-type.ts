import mongoose from 'mongoose';
import { Recipient } from '../models/Recipient';
import dotenv from 'dotenv';

dotenv.config();

async function migrateAddType() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Update all recipients that don't have a type field to have type='church'
    const result = await Recipient.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'church' } }
    );

    console.log(`Migration complete! Updated ${result.modifiedCount} recipients to have type='church'`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateAddType();
