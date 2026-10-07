import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  unlockUser,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireDeptHeadOrAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

// Staff Registrations Review & Approval
router.get('/pending-registrations', requireAdmin, getPendingRegistrations);
router.post('/:id/approve', requireAdmin, approveRegistration);
router.post('/:id/reject', requireAdmin, rejectRegistration);

// User Management
router.get('/', requireDeptHeadOrAdmin, getUsers);
router.get('/:id', requireDeptHeadOrAdmin, getUserById);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.post('/:id/unlock', requireAdmin, unlockUser);

export default router;
