import { Router, Response } from 'express';
import { z } from 'zod';
import { Recipient } from '../models/Recipient';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const recipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const bulkRecipientsSchema = z.object({
  emails: z.array(z.string().email()),
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
        update: { $setOnInsert: { email: email.toLowerCase(), tags: [] } },
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
