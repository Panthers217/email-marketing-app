import { Router, Response } from 'express';
import { z } from 'zod';
import { Recipient } from '../models/Recipient';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const recipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
});

const bulkRecipientsSchema = z.object({
  emails: z.array(z.string().email()),
});

const bulkCSVSchema = z.object({
  csvData: z.string(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = recipientSchema.parse(req.body);

    const recipient = await Recipient.findOneAndUpdate(
      { email: data.email.toLowerCase() },
      {
        email: data.email.toLowerCase(),
        name: data.name,
        tags: data.tags || [],
        city: data.city,
        county: data.county,
        subject: data.subject,
      },
      { new: true, upsert: true }
    );

    res.json(recipient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    if ((error as any).code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    throw error;
  }
});

router.post('/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { emails } = bulkRecipientsSchema.parse(req.body);

    const operations = emails.map((email) => ({
      updateOne: {
        filter: { email: email.toLowerCase() },
        update: { 
          $setOnInsert: { 
            email: email.toLowerCase(), 
            tags: [],
            subject: 'General', // Default subject for simple bulk import
          } 
        },
        upsert: true,
      },
    }));

    const result = await Recipient.bulkWrite(operations);

    res.json({
      success: true,
      inserted: result.upsertedCount,
      total: emails.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
});

router.post('/bulk-csv', async (req: AuthRequest, res: Response) => {
  try {
    const { csvData } = bulkCSVSchema.parse(req.body);

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const recipients: any[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Simple CSV parser - handles quoted fields with commas
      const fields: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim()); // Add last field

      // Parse fields: email, name, city, county, tags (subject defaults to 'General')
      const [email, name, city, county, tags] = fields;

      if (!email || !email.includes('@')) continue; // Skip invalid emails

      const recipient: any = {
        email: email.toLowerCase(),
        subject: 'General', // Default subject for CSV import
      };

      if (name) recipient.name = name;
      if (city) recipient.city = city;
      if (county) recipient.county = county;
      if (tags) {
        // Split tags by comma if they exist
        recipient.tags = tags.split(',').map(t => t.trim()).filter(t => t);
      } else {
        recipient.tags = [];
      }

      recipients.push(recipient);
    }

    if (recipients.length === 0) {
      res.status(400).json({ error: 'No valid recipients found in CSV data' });
      return;
    }

    // Bulk insert/update
    const operations = recipients.map((recipient) => ({
      updateOne: {
        filter: { email: recipient.email },
        update: {
          $set: {
            email: recipient.email,
            name: recipient.name,
            city: recipient.city,
            county: recipient.county,
            tags: recipient.tags,
            subject: recipient.subject,
          },
        },
        upsert: true,
      },
    }));

    const result = await Recipient.bulkWrite(operations);

    res.json({
      success: true,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      total: recipients.length,
    });
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
    const { search, tag } = req.query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    if (tag) {
      filter.tags = tag;
    }

    const recipients = await Recipient.find(filter).sort({ createdAt: -1 });
    res.json(recipients);
  } catch (error) {
    throw error;
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const recipient = await Recipient.findByIdAndDelete(req.params.id);

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    throw error;
  }
});

export default router;
