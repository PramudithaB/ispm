"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getPublicDepartments = exports.getDepartments = void 0;
const db_1 = require("../config/db");
const auditService_1 = require("../services/auditService");
const getDepartments = async (req, res) => {
    try {
        const departments = await db_1.prisma.department.findMany({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch departments from MySQL.',
            error: error.message,
        });
    }
};
exports.getDepartments = getDepartments;
const getPublicDepartments = async (req, res) => {
    try {
        const departments = await db_1.prisma.department.findMany({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public department directory.',
            error: error.message,
        });
    }
};
exports.getPublicDepartments = getPublicDepartments;
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
        const trimmedName = name.trim();
        const existing = await db_1.prisma.department.findUnique({
            where: { name: trimmedName },
        });
        if (existing) {
            res.status(409).json({
                success: false,
                message: 'A department with this name already exists.',
            });
            return;
        }
        const department = await db_1.prisma.department.create({
            data: {
                name: trimmedName,
                description: description?.trim() || null,
                site: site?.trim() || 'Hemas Hospital Wattala',
            },
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
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
        const departmentId = req.params.id;
        const department = await db_1.prisma.department.update({
            where: { id: departmentId },
            data: {
                name: name ? name.trim() : undefined,
                description: description !== undefined ? description.trim() : undefined,
                site: site ? site.trim() : undefined,
            },
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
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
        const departmentId = req.params.id;
        // Check staff assigned to this department
        const staffCount = await db_1.prisma.user.count({
            where: { departmentId },
        });
        if (staffCount > 0) {
            res.status(400).json({
                success: false,
                message: `Cannot delete department: ${staffCount} staff member(s) are currently assigned to it. Please reassign them first.`,
            });
            return;
        }
        await db_1.prisma.department.delete({
            where: { id: departmentId },
        });
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
