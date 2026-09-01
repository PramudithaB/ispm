import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app';
import { connectDB, disconnectDB, prisma } from '../config/db';

describe('Real Registration & Authentication Flow on MySQL `ispm`', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Clean up created test users
    await prisma.auditLog.deleteMany({
      where: {
        userEmail: {
          in: ['newstaff.test@securehemas.local', 'existing.test@securehemas.local'],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['newstaff.test@securehemas.local', 'existing.test@securehemas.local'],
        },
      },
    });
    await disconnectDB();
  });

  describe('Registration Validations', () => {
    it('should reject registration if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Staff',
          // missing employeeId, email, password
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    it('should reject registration if passwords do not match', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Mismatched User',
          employeeId: 'HEM-TST-001',
          email: 'mismatch@securehemas.local',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Passwords do not match');
    });

    it('should reject registration if password is shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Short Pass User',
          employeeId: 'HEM-TST-002',
          email: 'shortpass@securehemas.local',
          password: '12345',
          confirmPassword: '12345',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least 8 characters');
    });
  });

  describe('Real User Registration in MySQL `ispm.users`', () => {
    const testEmployeeId = 'HEM-TST-999';
    const testEmail = 'newstaff.test@securehemas.local';
    const testPassword = 'ClinicalSecure2026!';

    it('should successfully register a new user, insert into MySQL `ispm.users`, and return JWT token', async () => {
      // Ensure user doesn't already exist
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Nimali Jayasuriya',
          employeeId: testEmployeeId,
          email: testEmail,
          password: testPassword,
          confirmPassword: testPassword,
          role: 'STAFF',
          position: 'Critical Care Registered Nurse',
          site: 'Hemas Hospital Wattala',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.fullName).toBe('Nimali Jayasuriya');
      expect(res.body.user.employeeId).toBe(testEmployeeId);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('STAFF');
      expect(res.body.user.position).toBe('Critical Care Registered Nurse');
      expect(res.body.user.site).toBe('Hemas Hospital Wattala');
      // Verify NEVER returning passwordHash to the frontend
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();

      // Directly verify row in MySQL ispm.users table
      const dbUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser!.email).toBe(testEmail);
      expect(dbUser!.employeeId).toBe(testEmployeeId);
      expect(dbUser!.fullName).toBe('Nimali Jayasuriya');

      // Direct verification: Password MUST be bcrypt hashed, NEVER plaintext
      expect(dbUser!.passwordHash).not.toBe(testPassword);
      expect(dbUser!.passwordHash.startsWith('$2')).toBe(true); // bcrypt prefix $2a$ or $2b$
      const isBcryptMatch = await bcrypt.compare(testPassword, dbUser!.passwordHash);
      expect(isBcryptMatch).toBe(true);
    });

    it('should reject registration if email already exists (Duplicate Email Check)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Another Name',
          employeeId: 'HEM-TST-888',
          email: testEmail, // Duplicate email
          password: 'AnotherPassword123!',
          confirmPassword: 'AnotherPassword123!',
          role: 'STAFF',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email address already exists');
    });

    it('should reject registration if employeeId already exists (Duplicate Employee ID Check)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Another Name',
          employeeId: testEmployeeId, // Duplicate employeeId
          email: 'unique.different@securehemas.local',
          password: 'AnotherPassword123!',
          confirmPassword: 'AnotherPassword123!',
          role: 'STAFF',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Employee ID already exists');
    });
  });

  describe('Login & JWT Authentication with Newly Registered User', () => {
    const testEmail = 'newstaff.test@securehemas.local';
    const testPassword = 'ClinicalSecure2026!';
    let authToken: string;

    it('should successfully log in with the registered user credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('STAFF');
      expect(res.body.user.passwordHash).toBeUndefined();

      authToken = res.body.token;
    });

    it('should authenticate protected endpoints using the issued JWT Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.fullName).toBe('Nimali Jayasuriya');
      expect(res.body.user.role).toBe('STAFF');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should verify RBAC rules for the newly registered STAFF user', async () => {
      // STAFF can view policies
      const policiesRes = await request(app)
        .get('/api/policies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(policiesRes.status).toBe(200);
      expect(policiesRes.body.success).toBe(true);

      // STAFF is forbidden from admin compliance summary
      const complianceRes = await request(app)
        .get('/api/compliance/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(complianceRes.status).toBe(403);
    });
  });
});
