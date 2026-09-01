import { Router } from 'express';
import {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  getQuizForModule,
  submitQuiz,
  getAdminQuiz,
  saveAdminQuiz,
  deleteQuiz,
} from '../controllers/trainingController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { uploadPdf } from '../middleware/upload';

const router = Router();

router.use(authenticate);

// Training Module CRUD
router.get('/', getTrainings);
router.get('/:id', getTrainingById);
router.post('/', requireAdmin, uploadPdf.single('pdf'), createTraining);
router.put('/:id', requireAdmin, uploadPdf.single('pdf'), updateTraining);
router.delete('/:id', requireAdmin, deleteTraining);

// Admin Quiz Management
router.get('/:id/admin-quiz', requireAdmin, getAdminQuiz);
router.put('/:id/quiz', requireAdmin, saveAdminQuiz);
router.delete('/:id/quiz', requireAdmin, deleteQuiz);

// Staff Quiz Test-Taking
router.get('/:id/quiz', getQuizForModule);
router.post('/:id/submit-quiz', submitQuiz);

export default router;
