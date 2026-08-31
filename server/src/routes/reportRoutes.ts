import { Router } from 'express';
import {
  exportComplianceReport,
  exportIncidentsReport,
  exportTrainingReport,
  exportAuditLogsReport,
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireDeptHeadOrAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/compliance', requireDeptHeadOrAdmin, exportComplianceReport);
router.get('/incidents', requireAdmin, exportIncidentsReport);
router.get('/training', requireDeptHeadOrAdmin, exportTrainingReport);
router.get('/audit-logs', requireAdmin, exportAuditLogsReport);

export default router;
