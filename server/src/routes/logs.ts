import { Router, Response } from 'express';
import { SendLog, IPopulatedSendLog } from '../models/SendLog';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = '50', name, city, county, subject, date, time } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    const logs = await SendLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .populate('campaignId', 'name subject')
      .populate('recipientId', 'email name city county subject time date') as unknown as IPopulatedSendLog[];

    // Filter by recipient fields after population
    let filteredLogs = logs;

    if (name) {
      const nameQuery = (name as string).toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.recipientId.name?.toLowerCase().includes(nameQuery)
      );
    }

    if (city) {
      const cityQuery = (city as string).toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.recipientId.city?.toLowerCase().includes(cityQuery)
      );
    }

    if (county) {
      const countyQuery = (county as string).toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.recipientId.county?.toLowerCase().includes(countyQuery)
      );
    }

    if (subject) {
      const subjectQuery = (subject as string).toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.recipientId.subject?.toLowerCase().includes(subjectQuery)
      );
    }

    if (date) {
      const dateQuery = date as string;
      filteredLogs = filteredLogs.filter(log => {
        if (!log.recipientId.date) return false;
        const logDate = new Date(log.recipientId.date).toISOString().split('T')[0];
        return logDate === dateQuery;
      });
    }

    if (time) {
      const timeQuery = (time as string).toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.recipientId.time?.toLowerCase().includes(timeQuery)
      );
    }

    res.json(filteredLogs);
  } catch (error) {
    throw error;
  }
});

export default router;
