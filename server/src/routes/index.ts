import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import departmentRoutes from './departmentRoutes';
import policyRoutes from './policyRoutes';
import trainingRoutes from './trainingRoutes';
import complianceRoutes from './complianceRoutes';
import incidentRoutes from './incidentRoutes';
import notificationRoutes from './notificationRoutes';
import auditRoutes from './auditRoutes';
import reportRoutes from './reportRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/policies', policyRoutes);
router.use('/training', trainingRoutes);
router.use('/compliance', complianceRoutes);
router.use('/incidents', incidentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/reports', reportRoutes);

// Health check endpoints
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'SecureHemas API',
    timestamp: new Date(),
    version: '1.0.0',
  });
});

router.get('/health/db', async (req, res) => {
  try {
    const { prisma } = await import('../config/db');
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      database: 'securehemas',
      message: 'MySQL connection successful',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      database: 'securehemas',
      message: `MySQL connection failed: ${error.message}`,
    });
  }
});

export default router;
