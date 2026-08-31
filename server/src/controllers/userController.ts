import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { department, role, search, isActive } = req.query;

    const filter: any = {};
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { position: searchRegex },
      ];
    }

    // If user is Department Head, constrain to their department only
    if (req.user?.role === 'DEPARTMENT_HEAD' && req.user.department) {
      filter.department = req.user.department;
    }

    const users = await User.find(filter)
      .populate('department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
      error: error.message,
    });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('department');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user.',
      error: error.message,
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      employeeId,
      fullName,
      email,
      password,
      role,
      department,
      site,
      position,
    } = req.body;

    if (!employeeId || !fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Employee ID, Full Name, Email, and Password are required.',
      });
      return;
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
      return;
    }

    const existingEmpId = await User.findOne({ employeeId: employeeId.toUpperCase().trim() });
    if (existingEmpId) {
      res.status(409).json({
        success: false,
        message: 'A user with this Employee ID already exists.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      employeeId: employeeId.toUpperCase().trim(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'STAFF',
      department: department || null,
      site: site || 'Hemas Hospital Wattala',
      position: position || 'Staff Member',
      isActive: true,
    });

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'USER_CREATED',
      module: 'USERS',
      entityId: newUser._id.toString(),
      metadata: { newUserId: newUser._id, employeeId: newUser.employeeId, role: newUser.role },
      req,
    });

    const populatedUser = await User.findById(newUser._id).populate('department');

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: populatedUser,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user.',
      error: error.message,
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, role, department, site, position, password, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (fullName) user.fullName = fullName.trim();
    if (role) user.role = role;
    if (department !== undefined) user.department = department || null;
    if (site) user.site = site.trim();
    if (position) user.position = position.trim();
    if (isActive !== undefined) user.isActive = isActive;

    if (password && password.length >= 6) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'USER_UPDATED',
      module: 'USERS',
      entityId: user._id.toString(),
      metadata: { targetEmployeeId: user.employeeId },
      req,
    });

    const updatedUser = await User.findById(user._id).populate('department');

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user.',
      error: error.message,
    });
  }
};

export const unlockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'USER_UNLOCKED',
      module: 'USERS',
      entityId: user._id.toString(),
      metadata: { unlockedEmployeeId: user.employeeId },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Account for ${user.fullName} (${user.employeeId}) has been unlocked.`,
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to unlock user account.',
      error: error.message,
    });
  }
};
