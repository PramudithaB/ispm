import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config/env';
import { logAudit } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      departmentId: user.department ? user.department.toString() : null,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, fullName, email, password, department, position, site } = req.body;

    if (!employeeId || !fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Employee ID, Full Name, Email, and Password are required.',
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

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const existingEmpId = await User.findOne({ employeeId: normalizedEmpId });
    if (existingEmpId) {
      res.status(409).json({
        success: false,
        message: 'An account with this Employee ID already exists.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      employeeId: normalizedEmpId,
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'STAFF', // Safe default
      department: department || null,
      site: site?.trim() || 'Hemas Hospital Wattala',
      position: position?.trim() || 'Hospital Staff',
      isActive: true,
    });

    await logAudit({
      userId: newUser._id,
      userEmail: newUser.email,
      userRole: 'STAFF',
      action: 'USER_CREATED',
      module: 'AUTH',
      entityId: newUser._id.toString(),
      metadata: { registrationType: 'Self-Registration', employeeId: newUser.employeeId },
      req,
    });

    const populatedUser = await User.findById(newUser._id).populate('department');
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Staff account registered successfully.',
      token,
      user: {
        _id: populatedUser!._id,
        employeeId: populatedUser!.employeeId,
        fullName: populatedUser!.fullName,
        email: populatedUser!.email,
        role: populatedUser!.role,
        department: populatedUser!.department,
        site: populatedUser!.site,
        position: populatedUser!.position,
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
        message: 'Please provide both email and password.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail })
      .select('+passwordHash')
      .populate('department');

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
        message: 'Invalid email address or password.',
      });
      return;
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockMinutesRemaining = Math.ceil(
        ((user.lockUntil?.getTime() || 0) - Date.now()) / 60000
      );

      await logAudit({
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        metadata: { reason: 'Account locked', lockMinutesRemaining },
        req,
      });

      res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to excessive failed attempts. Try again in ${lockMinutesRemaining} minute(s).`,
        isLocked: true,
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      await logAudit({
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        metadata: { reason: 'Account deactivated' },
        req,
      });

      res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact your Hospital Administrator.',
      });
      return;
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account after 5 failed attempts for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await logAudit({
          userId: user._id,
          userEmail: user.email,
          userRole: user.role,
          action: 'USER_LOCKED',
          module: 'AUTH',
          metadata: { attempts: user.failedLoginAttempts },
          req,
        });
      }

      await user.save();

      await logAudit({
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        metadata: { attempts: user.failedLoginAttempts, locked: user.isLocked() },
        req,
      });

      const attemptsRemaining = Math.max(0, 5 - user.failedLoginAttempts);
      res.status(401).json({
        success: false,
        message:
          user.failedLoginAttempts >= 5
            ? 'Account locked for 15 minutes due to 5 failed login attempts.'
            : `Invalid credentials. ${attemptsRemaining} attempt(s) remaining before account lockout.`,
        attemptsRemaining,
      });
      return;
    }

    // Login successful: reset failed login attempts & lock
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = generateToken(user);

    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      module: 'AUTH',
      metadata: { site: user.site, position: user.position },
      req,
    });

    const userResponse = {
      _id: user._id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      site: user.site,
      position: user.position,
      isActive: user.isActive,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userResponse,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Login processing error.',
      error: error.message,
    });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user._id,
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
      message: 'Logout processing error.',
      error: error.message,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current user profile.',
      error: error.message,
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { fullName, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (fullName) {
      user.fullName = fullName.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
        return;
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long.',
        });
        return;
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_UPDATED',
      module: 'USERS',
      metadata: { updatedFields: { fullName: !!fullName, password: !!newPassword } },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        site: user.site,
        position: user.position,
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
