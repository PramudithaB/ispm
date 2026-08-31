import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  unlockUser,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireDeptHeadOrAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

// Department heads can view department staff; Admins can view all and manage
router.get('/', requireDeptHeadOrAdmin, getUsers);
router.get('/:id', requireDeptHeadOrAdmin, getUserById);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.post('/:id/unlock', requireAdmin, unlockUser);

export default router;
