import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB, prisma } from '../config/db';
import bcrypt from 'bcryptjs';

describe('Real Registration, Email Verification, Admin Approval & Password Reset Flow', () => {
  beforeAll(async () => {
    await connectDB();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['nimal.perera@securehemas.local', 'rejected.nurse@securehemas.local'] },
      },
    });
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: { in: ['nimal.perera@securehemas.local', 'rejected.nurse@securehemas.local'] },
      },
    });
    await disconnectDB();
  });

  let verificationToken: string;
  let registeredUserId: string;
  let adminToken: string;
  let resetToken: string;

  describe('1. Staff Registration Validation & Creation', () => {
    it('should reject registration if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test@securehemas.local',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration if passwords do not match', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          employeeId: 'HEM-DOC-999',
          fullName: 'Dr. Nimal Perera',
          email: 'nimal.perera@securehemas.local',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Passwords do not match.');
    });

    it('should register staff user, create PENDING unverified account in MySQL, and generate verification token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          employeeId: 'HEM-DOC-999',
          fullName: 'Dr. Nimal Perera',
          email: 'nimal.perera@securehemas.local',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          position: 'Consultant Physician',
          site: 'Hemas Hospital Wattala',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Please check your email and verify your email address');

      // Verify row in MySQL ispm.users table
      const dbUser = await prisma.user.findUnique({
        where: { email: 'nimal.perera@securehemas.local' },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser!.role).toBe('STAFF'); // Always STAFF
      expect(dbUser!.accountStatus).toBe('PENDING');
      expect(dbUser!.emailVerified).toBe(false);
      expect(dbUser!.isActive).toBe(false);
      expect(dbUser!.verificationToken).not.toBeNull();
      expect(dbUser!.verificationTokenExpiry).not.toBeNull();

      registeredUserId = dbUser!.id;
      verificationToken = dbUser!.verificationToken!;
    });
  });

  describe('2. Login Restrictions for Unverified & Pending Accounts', () => {
    it('should block login when email is not verified', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nimal.perera@securehemas.local',
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please verify your email address before logging in.');
      expect(res.body.isUnverified).toBe(true);
    });
  });

  describe('3. Email Verification Flow', () => {
    it('should reject email verification with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid_nonexistent_token_123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should verify email successfully with valid token and update MySQL', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Email verified successfully');

      // Check in MySQL
      const dbUser = await prisma.user.findUnique({
        where: { id: registeredUserId },
      });

      expect(dbUser!.emailVerified).toBe(true);
      expect(dbUser!.verificationToken).toBeNull(); // Token cleared
      expect(dbUser!.accountStatus).toBe('PENDING'); // Still pending approval
    });

    it('should block login when email is verified but waiting for admin approval', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nimal.perera@securehemas.local',
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Your account is waiting for administrator approval.');
      expect(res.body.isPending).toBe(true);
    });
  });

  describe('4. Admin Staff Registration Review & Approval', () => {
    beforeAll(async () => {
      // Login Admin
      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@securehemas.local', password: 'Password123!' });
      adminToken = adminRes.body.token;
    });

    it('should allow ADMIN to retrieve pending staff registrations queue', async () => {
      const res = await request(app)
        .get('/api/users/pending-registrations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.registrations.find((u: any) => u.id === registeredUserId);
      expect(found).toBeDefined();
      expect(found.emailVerified).toBe(true);
      expect(found.accountStatus).toBe('PENDING');
    });

    it('should allow ADMIN to approve staff registration and activate account', async () => {
      const res = await request(app)
        .post(`/api/users/${registeredUserId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in MySQL
      const dbUser = await prisma.user.findUnique({
        where: { id: registeredUserId },
      });

      expect(dbUser!.accountStatus).toBe('ACTIVE');
      expect(dbUser!.isActive).toBe(true);
    });

    it('should allow approved staff member to log in and receive JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nimal.perera@securehemas.local',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('STAFF');
      expect(res.body.user.accountStatus).toBe('ACTIVE');
    });
  });

  describe('5. Forgot Password & Password Reset Workflow', () => {
    it('should generate single-use reset token and return generic confirmation', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nimal.perera@securehemas.local' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Retrieve reset token from MySQL
      const dbUser = await prisma.user.findUnique({
        where: { id: registeredUserId },
      });

      expect(dbUser!.resetToken).not.toBeNull();
      expect(dbUser!.resetTokenExpiry).not.toBeNull();
      resetToken = dbUser!.resetToken!;
    });

    it('should reject password reset if token is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid_reset_token_xyz',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully reset password with valid token and update bcrypt hash', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Your password has been reset successfully');

      // Verify token cleared in MySQL
      const dbUser = await prisma.user.findUnique({
        where: { id: registeredUserId },
      });
      expect(dbUser!.resetToken).toBeNull();
    });

    it('should reject login with old password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nimal.perera@securehemas.local',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully log in with new password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nimal.perera@securehemas.local',
          password: 'NewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });
});
