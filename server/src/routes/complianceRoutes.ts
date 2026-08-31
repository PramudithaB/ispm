import { Router } from 'express';
import {
  getComplianceSummary,
  getDepartmentCompliance,
  getDepartmentStaffCompliance,
  getMyCompliance,
} from '../controllers/complianceController';
import { authenticate } from '../middleware/auth';
import { requireDeptHeadOrAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/my', getMyCompliance);
router.get('/summary', requireDeptHeadOrAdmin, getComplianceSummary);
router.get('/department', requireDeptHeadOrAdmin, getDepartmentCompliance);
router.get('/department/:deptId', requireDeptHeadOrAdmin, getDepartmentStaffCompliance);

export default router;
