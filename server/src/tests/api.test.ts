import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB, prisma } from '../config/db';
import { seedDatabase } from '../seed/seedData';

describe('SecureHemas MySQL & Prisma Full-Stack API Integration Tests', () => {
  let adminToken: string;
  let securityToken: string;
  let staffToken: string;
  let deptHeadToken: string;

  beforeAll(async () => {
    await connectDB();
    await seedDatabase();

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@securehemas.local', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Login Security Admin
    const secRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'security@securehemas.local', password: 'Password123!' });
    securityToken = secRes.body.token;

    // Login Staff
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@securehemas.local', password: 'Password123!' });
    staffToken = staffRes.body.token;

    // Login Dept Head
    const headRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'head@securehemas.local', password: 'Password123!' });
    deptHeadToken = headRes.body.token;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Authentication & Security Tests', () => {
    it('should successfully log in with valid credentials and return JWT and user details', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@securehemas.local', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('staff@securehemas.local');
      expect(res.body.user.passwordHash).toBeUndefined(); // passwordHash must never be exposed
    });

    it('should reject login with wrong password and decrement remaining attempts', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@securehemas.local', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.attemptsRemaining).toBeDefined();
    });

    it('should reject unauthenticated access to protected routes with 401', async () => {
      const res = await request(app).get('/api/compliance/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Role-Based Access Control (RBAC) Tests', () => {
    it('should block STAFF from accessing admin-only compliance summary endpoint (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/compliance/summary')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow IT_SECURITY_ADMIN and ADMIN to access compliance summary', async () => {
      const res = await request(app)
        .get('/api/compliance/summary')
        .set('Authorization', `Bearer ${securityToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.overallComplianceScore).toBeGreaterThanOrEqual(0);
    });

    it('should block STAFF from creating a new policy (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          title: 'Unauthorized Policy',
          description: 'Testing RBAC',
          content: 'Content',
          category: 'Data Privacy & Confidentiality',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('3. Policy Lifecycle & Acknowledgement Tests', () => {
    let createdPolicyId: string;

    it('should allow ADMIN / SECURITY to create a draft policy', async () => {
      const res = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({
          title: 'Automated Test Policy - Cloud Access',
          description: 'Guidelines for accessing cloud infrastructure',
          content: '### Cloud Security Guidelines\nMust use VPN and 2FA at all times.',
          category: 'Access Control & Passwords',
          version: '1.0',
          status: 'Draft',
        });

      expect(res.status).toBe(201);
      expect(res.body.policy).toBeDefined();
      expect(res.body.policy.status).toBe('Draft');
      createdPolicyId = res.body.policy._id || res.body.policy.id;
    });

    it('should hide draft policy from STAFF user', async () => {
      const res = await request(app)
        .get('/api/policies')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.policies.map((p: any) => p._id || p.id);
      expect(ids).not.toContain(createdPolicyId);
    });

    it('should allow publishing the policy and make it visible to STAFF', async () => {
      const pubRes = await request(app)
        .post(`/api/policies/${createdPolicyId}/publish`)
        .set('Authorization', `Bearer ${securityToken}`);

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.policy.status).toBe('Published');

      const staffRes = await request(app)
        .get(`/api/policies/${createdPolicyId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(staffRes.status).toBe(200);
      expect(staffRes.body.policy.status).toBe('Published');
    });

    it('should allow STAFF to acknowledge the published policy', async () => {
      const ackRes1 = await request(app)
        .post(`/api/policies/${createdPolicyId}/acknowledge`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(ackRes1.status).toBe(200);
      expect(ackRes1.body.success).toBe(true);
      expect(ackRes1.body.acknowledgement).toBeDefined();
    });
  });

  describe('4. Security Training & Interactive Quiz Engine Tests', () => {
    let trainingId: string;

    it('should retrieve published training modules with user progress', async () => {
      const res = await request(app)
        .get('/api/training')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.trainings.length).toBeGreaterThan(0);
      trainingId = res.body.trainings[0]._id || res.body.trainings[0].id;
    });

    it('CRITICAL: should SANITIZE quiz questions and NOT leak correctAnswer or explanation to the client', async () => {
      const res = await request(app)
        .get(`/api/training/${trainingId}/quiz`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quiz.questions.length).toBeGreaterThan(0);

      const firstQ = res.body.quiz.questions[0];
      expect(firstQ.questionId).toBeDefined();
      expect(firstQ.question).toBeDefined();
      expect(firstQ.options).toBeDefined();
      // Ensure NO correctAnswer and NO explanation are exposed in active quiz
      expect(firstQ.correctAnswer).toBeUndefined();
      expect(firstQ.explanation).toBeUndefined();
    });

    it('should grade quiz submission accurately, update progress, and return explanations after submission', async () => {
      const quizDoc = await prisma.quiz.findUnique({
        where: { trainingModuleId: trainingId },
        include: { questions: true },
      });
      expect(quizDoc).toBeDefined();

      // Formulate answers with 100% correct
      const answers = quizDoc!.questions.map((q) => ({
        questionId: q.questionId,
        selectedOption: q.correctAnswer,
      }));

      const res = await request(app)
        .post(`/api/training/${trainingId}/submit-quiz`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.result.passed).toBe(true);
      expect(res.body.result.score).toBe(100);
      expect(res.body.result.questions[0].explanation).toBeDefined();
    });
  });

  describe('5. Incident Reporting & Triage Workflow Tests', () => {
    let incidentId: string;

    it('should allow staff to report a cybersecurity incident', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          incidentType: 'Phishing',
          title: 'Urgent: Fake IT Password Reset Email',
          description: 'Received email asking for password from it-support@fake-hemas.com',
          priority: 'High',
        });

      expect(res.status).toBe(201);
      expect(res.body.incident.incidentNumber).toMatch(/^INC-\d{4}-\d{4}$/);
      expect(res.body.incident.status).toBe('Open');
      incidentId = res.body.incident._id || res.body.incident.id;
    });

    it('should allow IT Security Admin to triage and resolve the incident', async () => {
      const res = await request(app)
        .patch(`/api/incidents/${incidentId}/status`)
        .set('Authorization', `Bearer ${securityToken}`)
        .send({
          status: 'Resolved',
          resolutionNotes: 'Phishing sender domain blocked hospital-wide.',
        });

      expect(res.status).toBe(200);
      expect(res.body.incident.status).toBe('Resolved');
      expect(res.body.incident.resolvedAt).toBeDefined();
    });
  });

  describe('6. Tamper-Evident Audit Logging Tests', () => {
    it('should record audit log entries for sensitive operations and allow ADMIN to view them', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeGreaterThan(0);

      const actions = res.body.logs.map((l: any) => l.action);
      expect(actions).toContain('LOGIN');
    });
  });

  describe('7. Report Export Tests', () => {
    it('should export compliance report as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/compliance?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('Department,HospitalSite,StaffCount');
    });
  });
});
