import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';
import { UserRole } from '@prisma/client';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, department, search, isActive } = req.query;

    const where: any = {};

    if (role) where.role = role as UserRole;
    if (department) where.departmentId = department as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      const q = String(search);
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { employeeId: { contains: q } },
        { position: { contains: q } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        departmentId: true,
        department: true,
        site: true,
        position: true,
        isActive: true,
        failedLoginAttempts: true,
        lockUntil: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        ...u,
        _id: u.id,
        department: u.department ? { ...u.department, _id: u.department.id } : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users from MySQL.',
      error: error.message,
    });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        departmentId: true,
        department: true,
        site: true,
        position: true,
        isActive: true,
        failedLoginAttempts: true,
        lockUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user,
        _id: user.id,
        department: user.department ? { ...user.department, _id: user.department.id } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details.',
      error: error.message,
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, fullName, email, password, role, department, position, site } = req.body;

    if (!employeeId || !fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Employee ID, Full Name, Email, and Password are required.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmpId = employeeId.toUpperCase().trim();

    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      res.status(409).json({ success: false, message: 'Email address already exists.' });
      return;
    }

    const existingEmpId = await prisma.user.findUnique({ where: { employeeId: normalizedEmpId } });
    if (existingEmpId) {
      res.status(409).json({ success: false, message: 'Employee ID already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        employeeId: normalizedEmpId,
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: role || 'STAFF',
        departmentId: department || null,
        site: site?.trim() || 'Hemas Hospital Wattala',
        position: position?.trim() || 'Clinical Staff',
        isActive: true,
      },
      include: { department: true },
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'USER_CREATED',
      module: 'USERS',
      entityId: newUser.id,
      metadata: { createdUserEmail: newUser.email, role: newUser.role },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
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
        isActive: newUser.isActive,
      },
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
    const userId = req.params.id;
    const { fullName, role, department, position, site, isActive, password } = req.body;

    let passwordHash: string | undefined = undefined;
    if (password && password.length >= 8) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        role: role || undefined,
        departmentId: department !== undefined ? department || null : undefined,
        position: position ? position.trim() : undefined,
        site: site ? site.trim() : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        passwordHash,
      },
      include: { department: true },
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'USER_UPDATED',
      module: 'USERS',
      entityId: updatedUser.id,
      metadata: { updatedUserEmail: updatedUser.email, newRole: updatedUser.role, isActive: updatedUser.isActive },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
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
      },
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
    const userId = req.params.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'USER_UNLOCKED',
      module: 'USERS',
      entityId: user.id,
      metadata: { unlockedUserEmail: user.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Account for ${user.fullName} (${user.email}) has been successfully unlocked.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to unlock user account.',
      error: error.message,
    });
  }
};
