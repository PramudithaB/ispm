import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { config } from '../config/env';
import { logAudit } from '../services/auditService';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/emailService';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const generateToken = (user: { id: string; email: string; role: UserRole; departmentId: string | null }): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );
};

// ==========================================
// 1. STAFF REGISTRATION
// Only STAFF users can register themselves
// ==========================================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, fullName, email, password, confirmPassword, department, position, site } = req.body;

    if (!employeeId || !fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Employee ID, Full Name, Hospital Email, and Password are required.',
      });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmpId = employeeId.toUpperCase().trim();

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this hospital email address already exists.',
      });
      return;
    }

    // Check duplicate employee ID
    const existingEmpId = await prisma.user.findUnique({
      where: { employeeId: normalizedEmpId },
    });
    if (existingEmpId) {
      res.status(409).json({
        success: false,
        message: 'An account with this Employee ID already exists.',
      });
      return;
    }

    // Secure bcrypt password hash
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate secure email verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user in MySQL (Always role = STAFF, accountStatus = PENDING, emailVerified = false)
    const newUser = await prisma.user.create({
      data: {
        employeeId: normalizedEmpId,
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'STAFF', // Strictly STAFF - user cannot choose role
        departmentId: department || null,
        site: site?.trim() || 'Hemas Hospital Wattala',
        position: position?.trim() || 'Clinical Staff',
        isActive: false, // Inactive until email verified & approved by admin
        emailVerified: false,
        accountStatus: 'PENDING',
        verificationToken,
        verificationTokenExpiry,
      },
      include: { department: true },
    });

    // Send verification email via Nodemailer
    const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(newUser.email, newUser.fullName, verificationUrl);

    await logAudit({
      userId: newUser.id,
      userEmail: newUser.email,
      userRole: 'STAFF',
      action: 'STAFF_REGISTRATION_SUBMITTED',
      module: 'AUTH',
      entityId: newUser.id,
      metadata: {
        registrationType: 'Staff Self-Registration',
        employeeId: newUser.employeeId,
        accountStatus: 'PENDING',
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email and verify your email address. Your account will then be reviewed by an administrator.',
      email: newUser.email,
      accountStatus: 'PENDING',
      emailVerified: false,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    });
  }
};

// ==========================================
// 2. EMAIL VERIFICATION
// User clicks verification link in email
// ==========================================
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
      include: { department: true },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired email verification link. If you have already verified your email, your account is pending administrator approval.',
        isExpiredOrVerified: true,
      });
      return;
    }

    // Update user in MySQL: email verified, clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'EMAIL_VERIFIED',
      module: 'AUTH',
      entityId: user.id,
      metadata: { accountStatus: user.accountStatus },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is now pending administrator approval.',
      accountStatus: user.accountStatus,
      isApproved: user.accountStatus === 'ACTIVE',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Email verification processing failed.',
      error: error.message,
    });
  }
};

// ==========================================
// 3. RESEND VERIFICATION EMAIL
// ==========================================
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Hospital email is required.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && !user.emailVerified) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationTokenExpiry,
        },
      });

      const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(user.email, user.fullName, verificationUrl);
    }

    // Generic response to prevent user enumeration
    res.status(200).json({
      success: true,
      message: 'If an unverified account with that email exists, a new verification link has been sent.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email.',
      error: error.message,
    });
  }
};

// ==========================================
// 4. FORGOT PASSWORD (REQUEST RESET LINK)
// ==========================================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Hospital email is required.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.accountStatus !== 'REJECTED') {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, user.fullName, resetUrl);

      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'PASSWORD_RESET_REQUESTED',
        module: 'AUTH',
        metadata: { ipAddress: req.ip },
        req,
      });
    }

    // Prevent account enumeration by always returning generic message
    res.status(200).json({
      success: true,
      message: 'If an account exists for this email address, a password reset link has been sent.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Password reset request failed.',
      error: error.message,
    });
  }
};

// ==========================================
// 5. RESET PASSWORD (SUBMIT NEW PASSWORD)
// Single-use token verification & update
// ==========================================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    // Find user with matching, non-expired reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token. Please request a new link.',
      });
      return;
    }

    // Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear single-use token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'AUTH',
      entityId: user.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
      error: error.message,
    });
  }
};

// ==========================================
// 6. USER LOGIN
// Validates email verification & admin approval
// ==========================================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { department: true },
    });

    if (!user) {
      await logAudit({
        userEmail: normalizedEmail,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        metadata: { reason: 'User not found' },
        req,
      });
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    // Check account lockout
    if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      const minutesRemaining = Math.ceil(
        (new Date(user.lockUntil).getTime() - Date.now()) / (60 * 1000)
      );
      res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed logins. Please try again in ${minutesRemaining} minutes or contact IT Security.`,
        isLocked: true,
      });
      return;
    }

    // 1. Check Email Verification
    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        isUnverified: true,
        email: user.email,
      });
      return;
    }

    // 2. Check Administrator Approval Status
    if (user.accountStatus === 'PENDING') {
      res.status(403).json({
        success: false,
        message: 'Your account is waiting for administrator approval.',
        isPending: true,
      });
      return;
    }

    if (user.accountStatus === 'REJECTED') {
      res.status(403).json({
        success: false,
        message: 'Your registration was not approved.',
        isRejected: true,
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your Hospital Administrator.',
      });
      return;
    }

    // 3. Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const newAttempts = user.failedLoginAttempts + 1;
      let lockUntil: Date | null = null;

      if (newAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockUntil,
        },
      });

      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        metadata: { failedAttempts: newAttempts, isLocked: !!lockUntil },
        req,
      });

      if (lockUntil) {
        res.status(403).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
          isLocked: true,
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: `Invalid email or password credentials. ${5 - newAttempts} attempt(s) remaining before lockout.`,
        attemptsRemaining: 5 - newAttempts,
      });
      return;
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      });
    }

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      module: 'AUTH',
      metadata: { site: user.site, role: user.role },
      req,
    });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user.id,
        id: user.id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department ? { ...user.department, _id: user.department.id } : null,
        site: user.site,
        position: user.position,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message,
    });
  }
};

// ==========================================
// 7. USER LOGOUT
// ==========================================
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'LOGOUT',
        module: 'AUTH',
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Logout error.',
      error: error.message,
    });
  }
};

// ==========================================
// 8. GET CURRENT USER PROFILE (/me)
// ==========================================
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { department: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user.id,
        id: user.id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department ? { ...user.department, _id: user.department.id } : null,
        site: user.site,
        position: user.position,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error.message,
    });
  }
};

// ==========================================
// 9. UPDATE PROFILE
// ==========================================
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, position, site } = req.body;
    const userId = req.user!.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName?.trim() || undefined,
        position: position?.trim() || undefined,
        site: site?.trim() || undefined,
      },
      include: { department: true },
    });

    await logAudit({
      userId,
      userEmail: updatedUser.email,
      userRole: updatedUser.role,
      action: 'USER_UPDATED',
      module: 'USERS',
      entityId: userId,
      metadata: { profileUpdate: true },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: updatedUser.id,
        id: updatedUser.id,
        employeeId: updatedUser.employeeId,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department ? { ...updatedUser.department, _id: updatedUser.department.id } : null,
        site: updatedUser.site,
        position: updatedUser.position,
        isActive: updatedUser.isActive,
        emailVerified: updatedUser.emailVerified,
        accountStatus: updatedUser.accountStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
};
