import { Router } from 'express';
import {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  getQuizForModule,
  submitQuiz,
} from '../controllers/trainingController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getTrainings);
router.get('/:id', getTrainingById);
router.post('/', requireAdmin, createTraining);
router.put('/:id', requireAdmin, updateTraining);

// Quiz routes
router.get('/:id/quiz', getQuizForModule);
router.post('/:id/submit-quiz', submitQuiz);

export default router;
