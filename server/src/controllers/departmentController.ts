import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = departments.map((d) => ({
      _id: d.id,
      id: d.id,
      name: d.name,
      description: d.description,
      site: d.site,
      staffCount: d._count.users,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      departments: enriched,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments from MySQL.',
      error: error.message,
    });
  }
};

export const getPublicDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, site: true },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      departments: departments.map((d) => ({
        _id: d.id,
        id: d.id,
        name: d.name,
        site: d.site,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public department directory.',
      error: error.message,
    });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, site } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Department name is required.',
      });
      return;
    }

    const trimmedName = name.trim();
    const existing = await prisma.department.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A department with this name already exists.',
      });
      return;
    }

    const department = await prisma.department.create({
      data: {
        name: trimmedName,
        description: description?.trim() || null,
        site: site?.trim() || 'Hemas Hospital Wattala',
      },
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'USER_CREATED',
      module: 'DEPARTMENTS',
      entityId: department.id,
      metadata: { departmentName: department.name },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department: { ...department, _id: department.id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create department.',
      error: error.message,
    });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, site } = req.body;
    const departmentId = req.params.id;

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        site: site ? site.trim() : undefined,
      },
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'USER_UPDATED',
      module: 'DEPARTMENTS',
      entityId: department.id,
      metadata: { departmentName: department.name },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      department: { ...department, _id: department.id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update department.',
      error: error.message,
    });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departmentId = req.params.id;

    // Check staff assigned to this department
    const staffCount = await prisma.user.count({
      where: { departmentId },
    });

    if (staffCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete department: ${staffCount} staff member(s) are currently assigned to it. Please reassign them first.`,
      });
      return;
    }

    await prisma.department.delete({
      where: { id: departmentId },
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete department.',
      error: error.message,
    });
  }
};
