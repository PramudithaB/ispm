"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const auditService_1 = require("../services/auditService");
const getUsers = async (req, res) => {
    try {
        const { role, department, search, isActive } = req.query;
        const where = {};
        if (role)
            where.role = role;
        if (department)
            where.departmentId = department;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        if (search) {
            const q = String(search);
            where.OR = [
                { fullName: { contains: q } },
                { email: { contains: q } },
                { employeeId: { contains: q } },
                { position: { contains: q } },
            ];
        }
        const users = await db_1.prisma.user.findMany({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users from MySQL.',
            error: error.message,
        });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const user = await db_1.prisma.user.findUnique({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details.',
            error: error.message,
        });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
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
        const existingEmail = await db_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingEmail) {
            res.status(409).json({ success: false, message: 'Email address already exists.' });
            return;
        }
        const existingEmpId = await db_1.prisma.user.findUnique({ where: { employeeId: normalizedEmpId } });
        if (existingEmpId) {
            res.status(409).json({ success: false, message: 'Employee ID already exists.' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const newUser = await db_1.prisma.user.create({
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
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create user.',
            error: error.message,
        });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { fullName, role, department, position, site, isActive, password } = req.body;
        let passwordHash = undefined;
        if (password && password.length >= 8) {
            passwordHash = await bcryptjs_1.default.hash(password, 10);
        }
        const updatedUser = await db_1.prisma.user.update({
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
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user.',
            error: error.message,
        });
    }
};
exports.updateUser = updateUser;
const unlockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await db_1.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockUntil: null,
            },
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to unlock user account.',
            error: error.message,
        });
    }
};
exports.unlockUser = unlockUser;
