import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  reportIncident,
  updateIncidentStatus,
} from '../controllers/incidentController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.post('/', reportIncident);
router.patch('/:id/status', requireAdmin, updateIncidentStatus);
router.patch('/:id', requireAdmin, updateIncidentStatus);

export default router;
