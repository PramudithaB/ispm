import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, module, userEmail, startDate, endDate, search, limit = '100', page = '1' } = req.query;

    const where: any = {};

    if (action) where.action = action as string;
    if (module) where.module = module as string;
    if (userEmail) where.userEmail = { contains: userEmail as string };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { action: { contains: q } },
        { module: { contains: q } },
        { userEmail: { contains: q } },
        { ipAddress: { contains: q } },
        { entityId: { contains: q } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, employeeId: true, position: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      count: logs.length,
      logs: logs.map((l) => ({
        ...l,
        _id: l.id,
        user: l.user ? { ...l.user, _id: l.user.id } : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit trail records from MySQL.',
      error: error.message,
    });
  }
};
