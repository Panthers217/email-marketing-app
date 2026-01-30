import { Router, Response } from 'express';
import { Recipient } from '../models/Recipient';
import { Campaign } from '../models/Campaign';
import { SendLog } from '../models/SendLog';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const recipientCount = await Recipient.countDocuments();
    const campaignCount = await Campaign.countDocuments();

    // Sends today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sendsToday = await SendLog.countDocuments({
      status: 'sent',
      sentAt: { $gte: startOfDay },
    });

    const recentLogs = await SendLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('campaignId', 'name')
      .populate('recipientId', 'email');

    res.json({
      recipientCount,
      campaignCount,
      sendsToday,
      recentLogs,
    });
  } catch (error) {
    throw error;
  }
});

export default router;
