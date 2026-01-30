import { Router, Response } from 'express';
import { SendLog } from '../models/SendLog';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = '50' } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    const logs = await SendLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .populate('campaignId', 'name subject')
      .populate('recipientId', 'email name');

    res.json(logs);
  } catch (error) {
    throw error;
  }
});

export default router;
