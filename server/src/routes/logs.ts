import { Router, Response } from 'express';
import { SendLog, IPopulatedSendLog } from '../models/SendLog';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = '500', name, city, county, subject, date, time, deliveryStatus, opened, clicked } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (deliveryStatus) {
      filter.deliveryStatus = deliveryStatus;
    }

    if (opened === 'true') {
      filter.openedAt = { $exists: true, $ne: null };
    }

    if (clicked === 'true') {
      filter.clickedAt = { $exists: true, $ne: null };
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

    // Get status counts for all logs (not just filtered)
    const statusCounts = await SendLog.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get delivery status counts
    const deliveryCounts = await SendLog.aggregate([
      {
        $match: { deliveryStatus: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$deliveryStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get engagement counts
    const openedCount = await SendLog.countDocuments({ openedAt: { $exists: true, $ne: null } });
    const clickedCount = await SendLog.countDocuments({ clickedAt: { $exists: true, $ne: null } });

    const counts = {
      sent: statusCounts.find(s => s._id === 'sent')?.count || 0,
      failed: statusCounts.find(s => s._id === 'failed')?.count || 0,
      queued: statusCounts.find(s => s._id === 'queued')?.count || 0,
      total: statusCounts.reduce((sum, s) => sum + s.count, 0),
      delivered: deliveryCounts.find(d => d._id === 'delivered')?.count || 0,
      bounced: deliveryCounts.find(d => d._id === 'bounced')?.count || 0,
      complained: deliveryCounts.find(d => d._id === 'complained')?.count || 0,
      opened: openedCount,
      clicked: clickedCount,
    };

    res.json({ logs: filteredLogs, counts });
  } catch (error) {
    throw error;
  }
});

export default router;
