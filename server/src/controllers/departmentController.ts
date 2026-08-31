import { Response } from 'express';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Calculate staff count per department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const staffCount = await User.countDocuments({
          department: dept._id,
          isActive: true,
        });
        return {
          ...dept.toObject(),
          staffCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: departmentsWithCounts.length,
      departments: departmentsWithCounts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments.',
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

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A department with this name already exists.',
      });
      return;
    }

    const department = await Department.create({
      name: name.trim(),
      description: description?.trim() || '',
      site: site?.trim() || 'Hemas Hospital Wattala',
    });

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'USER_CREATED', // department creation
      module: 'DEPARTMENTS',
      entityId: department._id.toString(),
      metadata: { departmentName: department.name },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department,
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
    const department = await Department.findById(req.params.id);

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }

    if (name) department.name = name.trim();
    if (description !== undefined) department.description = description.trim();
    if (site) department.site = site.trim();

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      department,
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
    const department = await Department.findById(req.params.id);
    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }

    // Check if department has users
    const userCount = await User.countDocuments({ department: department._id });
    if (userCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete department. There are ${userCount} staff member(s) assigned to it.`,
      });
      return;
    }

    await Department.findByIdAndDelete(department._id);

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
