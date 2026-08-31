"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartments = void 0;
const Department_1 = require("../models/Department");
const User_1 = require("../models/User");
const auditService_1 = require("../services/auditService");
const getDepartments = async (req, res) => {
    try {
        const departments = await Department_1.Department.find().sort({ name: 1 });
        // Calculate staff count per department
        const departmentsWithCounts = await Promise.all(departments.map(async (dept) => {
            const staffCount = await User_1.User.countDocuments({
                department: dept._id,
                isActive: true,
            });
            return {
                ...dept.toObject(),
                staffCount,
            };
        }));
        res.status(200).json({
            success: true,
            count: departmentsWithCounts.length,
            departments: departmentsWithCounts,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch departments.',
            error: error.message,
        });
    }
};
exports.getDepartments = getDepartments;
const createDepartment = async (req, res) => {
    try {
        const { name, description, site } = req.body;
        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Department name is required.',
            });
            return;
        }
        const existing = await Department_1.Department.findOne({ name: name.trim() });
        if (existing) {
            res.status(409).json({
                success: false,
                message: 'A department with this name already exists.',
            });
            return;
        }
        const department = await Department_1.Department.create({
            name: name.trim(),
            description: description?.trim() || '',
            site: site?.trim() || 'Hemas Hospital Wattala',
        });
        await (0, auditService_1.logAudit)({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create department.',
            error: error.message,
        });
    }
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res) => {
    try {
        const { name, description, site } = req.body;
        const department = await Department_1.Department.findById(req.params.id);
        if (!department) {
            res.status(404).json({ success: false, message: 'Department not found.' });
            return;
        }
        if (name)
            department.name = name.trim();
        if (description !== undefined)
            department.description = description.trim();
        if (site)
            department.site = site.trim();
        await department.save();
        res.status(200).json({
            success: true,
            message: 'Department updated successfully.',
            department,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update department.',
            error: error.message,
        });
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department_1.Department.findById(req.params.id);
        if (!department) {
            res.status(404).json({ success: false, message: 'Department not found.' });
            return;
        }
        // Check if department has users
        const userCount = await User_1.User.countDocuments({ department: department._id });
        if (userCount > 0) {
            res.status(400).json({
                success: false,
                message: `Cannot delete department. There are ${userCount} staff member(s) assigned to it.`,
            });
            return;
        }
        await Department_1.Department.findByIdAndDelete(department._id);
        res.status(200).json({
            success: true,
            message: 'Department deleted successfully.',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete department.',
            error: error.message,
        });
    }
};
exports.deleteDepartment = deleteDepartment;
