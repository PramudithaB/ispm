import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { config } from '../config/env';
import { logAudit } from '../services/auditService';
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

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, fullName, email, password, confirmPassword, role, department, position, site } = req.body;

    if (!employeeId || !fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Employee ID, Full Name, Email, and Password are required.',
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

    const validRoles = ['STAFF', 'DEPARTMENT_HEAD', 'ADMIN', 'IT_SECURITY_ADMIN'];
    const assignedRole: UserRole = role && validRoles.includes(role) ? (role as UserRole) : 'STAFF';

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmpId = employeeId.toUpperCase().trim();

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

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

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        employeeId: normalizedEmpId,
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        departmentId: department || null,
        site: site?.trim() || 'Hemas Hospital Wattala',
        position: position?.trim() || 'Clinical Staff',
        isActive: true,
      },
      include: { department: true },
    });

    await logAudit({
      userId: newUser.id,
      userEmail: newUser.email,
      userRole: 'STAFF',
      action: 'USER_CREATED',
      module: 'AUTH',
      entityId: newUser.id,
      metadata: { registrationType: 'Self-Registration', employeeId: newUser.employeeId },
      req,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Staff account registered successfully.',
      token,
      user: {
        _id: newUser.id,
        id: newUser.id,
        employeeId: newUser.employeeId,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department ? { ...newUser.department, _id: newUser.department.id } : null,
        site: newUser.site,
        position: newUser.position,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    });
  }
};

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

    // Check if account is locked
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

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your Hospital Administrator.',
      });
      return;
    }

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

    // Reset failed attempts upon successful authentication
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
      metadata: { site: user.site },
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
