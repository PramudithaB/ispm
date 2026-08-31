import { Router } from 'express';
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  publishPolicy,
  archivePolicy,
  acknowledgePolicy,
  getPolicyAcknowledgements,
} from '../controllers/policyController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireDeptHeadOrAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getPolicies);
router.get('/:id', getPolicyById);
router.post('/', requireAdmin, createPolicy);
router.put('/:id', requireAdmin, updatePolicy);
router.post('/:id/publish', requireAdmin, publishPolicy);
router.post('/:id/archive', requireAdmin, archivePolicy);
router.post('/:id/acknowledge', acknowledgePolicy);
router.get('/:id/acknowledgements', requireDeptHeadOrAdmin, getPolicyAcknowledgements);

export default router;
