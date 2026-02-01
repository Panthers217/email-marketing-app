import { Router, Response } from 'express';
import { z } from 'zod';
import { Recipient } from '../models/Recipient';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const recipientSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  city: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  subject: z.string().min(1, 'Subject is required'),
  denomination: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
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
        denomination: data.denomination,
        phone: data.phone,
        street: data.street,
        state: data.state,
        zip: data.zip,
        website: data.website,
        source_url: data.source_url,
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

      // Parse fields: email, name, city, county, tags, denomination, phone, street, state, zip, website, source_url
      const [email, name, city, county, tags, denomination, phone, street, state, zip, website, source_url] = fields;

      if (!email || !email.includes('@')) continue; // Skip invalid emails

      const recipient: any = {
        email: email.toLowerCase(),
        subject: 'General', // Default subject for CSV import
      };

      if (name) recipient.name = name;
      if (city) recipient.city = city;
      if (county) recipient.county = county;
      if (denomination) recipient.denomination = denomination;
      if (phone) recipient.phone = phone;
      if (street) recipient.street = street;
      if (state) recipient.state = state;
      if (zip) recipient.zip = zip;
      if (website) recipient.website = website;
      if (source_url) recipient.source_url = source_url;
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
            name: recipient.name || null,
            city: recipient.city || null,
            county: recipient.county || null,
            tags: recipient.tags,
            subject: recipient.subject,
            denomination: recipient.denomination || null,
            phone: recipient.phone || null,
            street: recipient.street || null,
            state: recipient.state || null,
            zip: recipient.zip || null,
            website: recipient.website || null,
            source_url: recipient.source_url || null,
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
