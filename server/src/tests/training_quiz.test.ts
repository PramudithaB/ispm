import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB, prisma } from '../config/db';
import path from 'path';
import fs from 'fs';

describe('Training & Quiz Module Full Workflow Tests', () => {
  let adminToken: string;
  let staffToken: string;
  let dummyPdfPath: string;

  beforeAll(async () => {
    await connectDB();

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@securehemas.local', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Login Staff
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@securehemas.local', password: 'Password123!' });
    staffToken = staffRes.body.token;

    // Create a dummy PDF file for testing
    const testDir = path.resolve(__dirname, '../../uploads/trainings');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    dummyPdfPath = path.join(testDir, 'test-guidelines.pdf');
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4 mock pdf content for testing');
  });

  afterAll(async () => {
    if (fs.existsSync(dummyPdfPath)) {
      try { fs.unlinkSync(dummyPdfPath); } catch {}
    }
    await disconnectDB();
  });

  let createdModuleId: string;

  describe('1. Admin Training Module CRUD with PDF Upload', () => {
    it('should allow ADMIN to create a training module with an attached PDF document', async () => {
      const res = await request(app)
        .post('/api/training')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Clinical Workstation & Portable Device Security')
        .field('description', 'Comprehensive guidelines for securing mobile nursing devices and clinical PACS terminals.')
        .field('content', 'Never leave nursing workstations unlocked when attending to patients.')
        .field('category', 'Device Security')
        .field('durationMinutes', '20')
        .field('passingScore', '70')
        .field('status', 'Published')
        .attach('pdf', dummyPdfPath);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.training).toBeDefined();
      expect(res.body.training.title).toBe('Clinical Workstation & Portable Device Security');
      expect(res.body.training.pdfFileName).toBe('test-guidelines.pdf');
      expect(res.body.training.pdfFilePath).toContain('/uploads/trainings/');

      createdModuleId = res.body.training._id || res.body.training.id;

      // Verify row in MySQL ispm.training_modules table
      const dbModule = await prisma.trainingModule.findUnique({
        where: { id: createdModuleId },
      });
      expect(dbModule).not.toBeNull();
      expect(dbModule!.pdfFileName).toBe('test-guidelines.pdf');
      expect(dbModule!.pdfFilePath).toBeDefined();
    });

    it('should block STAFF from creating a training module (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/training')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          title: 'Unauthorized Module',
          description: 'Staff should not be allowed',
          category: 'Phishing Awareness',
        });

      expect(res.status).toBe(403);
    });

    it('should allow STAFF to view the training module and see the PDF reference', async () => {
      const res = await request(app)
        .get(`/api/training/${createdModuleId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.training.pdfFileName).toBe('test-guidelines.pdf');
      expect(res.body.training.pdfFilePath).toBeDefined();
    });
  });

  describe('2. Admin Quiz Management (Questions with Options A, B, C, D)', () => {
    it('should allow ADMIN to save quiz questions with 4 options and correct answer index', async () => {
      const questionsPayload = [
        {
          questionId: 'q1',
          question: 'What is the required action before leaving a nursing station computer?',
          options: [
            'Leave it open so colleagues can use it',
            'Lock the screen immediately (Win + L or Logout)',
            'Turn off the monitor only',
            'Leave a sticky note with password',
          ],
          correctAnswer: 1, // Option B is correct
          explanation: 'Locking the screen prevents unauthorized access to patient health records.',
        },
        {
          questionId: 'q2',
          question: 'Where should USB flash drives used for clinical medical imaging be stored?',
          options: [
            'In locked hospital IT cabinets with encryption',
            'In public nurse lounge drawers',
            'In staff personal vehicles',
            'Anywhere near the hospital reception',
          ],
          correctAnswer: 0, // Option A is correct
          explanation: 'Removable media holding clinical files must be encrypted and physically secured.',
        },
      ];

      const res = await request(app)
        .put(`/api/training/${createdModuleId}/quiz`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          passingScore: 70,
          questions: questionsPayload,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.quiz.questions.length).toBe(2);

      // Verify in MySQL
      const dbQuiz = await prisma.quiz.findUnique({
        where: { trainingModuleId: createdModuleId },
        include: { questions: true },
      });
      expect(dbQuiz).not.toBeNull();
      expect(dbQuiz!.questions.length).toBe(2);
      expect(dbQuiz!.questions[0].correctAnswer).toBe(1);
    });

    it('should allow ADMIN to retrieve full quiz details including answer keys', async () => {
      const res = await request(app)
        .get(`/api/training/${createdModuleId}/admin-quiz`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quiz.questions[0].correctAnswer).toBe(1);
      expect(res.body.quiz.questions[0].explanation).toBeDefined();
    });

    it('CRITICAL: should SANITIZE quiz questions for staff test-taking', async () => {
      const res = await request(app)
        .get(`/api/training/${createdModuleId}/quiz`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quiz.questions.length).toBe(2);
      // Correct answer and explanation must NEVER leak to test-taking staff
      expect(res.body.quiz.questions[0].correctAnswer).toBeUndefined();
      expect(res.body.quiz.questions[0].explanation).toBeUndefined();
    });
  });

  describe('3. Staff Quiz Submission, Scoring, and Progress Tracking', () => {
    it('should evaluate failed attempt (< 70%), set status = Not Completed, and allow retry', async () => {
      const answers = [
        { questionId: 'q1', selectedOption: 0 }, // wrong answer (0 instead of 1)
        { questionId: 'q2', selectedOption: 3 }, // wrong answer (3 instead of 0)
      ];

      const res = await request(app)
        .post(`/api/training/${createdModuleId}/submit-quiz`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.result.passed).toBe(false);
      expect(res.body.result.score).toBe(0);

      // Check training progress in database
      const progress = await prisma.trainingProgress.findFirst({
        where: { trainingModuleId: createdModuleId },
      });
      expect(progress).not.toBeNull();
      expect(progress!.status).toBe('Not Completed');
    });

    it('should evaluate passing attempt (100%), set status = Completed in MySQL, and record attempt', async () => {
      const answers = [
        { questionId: 'q1', selectedOption: 1 }, // correct
        { questionId: 'q2', selectedOption: 0 }, // correct
      ];

      const res = await request(app)
        .post(`/api/training/${createdModuleId}/submit-quiz`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.result.passed).toBe(true);
      expect(res.body.result.score).toBe(100);

      // Check training progress in MySQL
      const progress = await prisma.trainingProgress.findFirst({
        where: { trainingModuleId: createdModuleId },
      });
      expect(progress).not.toBeNull();
      expect(progress!.status).toBe('Completed');
      expect(progress!.score).toBe(100);
      expect(progress!.completedAt).not.toBeNull();
    });
  });

  describe('4. Training Module Deletion & Clean-up', () => {
    it('should allow ADMIN to delete the module and clean up MySQL records', async () => {
      const res = await request(app)
        .delete(`/api/training/${createdModuleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbCheck = await prisma.trainingModule.findUnique({
        where: { id: createdModuleId },
      });
      expect(dbCheck).toBeNull();
    });
  });
});
