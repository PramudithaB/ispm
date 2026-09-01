"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const auditService_1 = require("../services/auditService");
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
    }, env_1.config.jwtSecret, { expiresIn: env_1.config.jwtExpiresIn });
};
const register = async (req, res) => {
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
        const existingEmail = await db_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingEmail) {
            res.status(409).json({
                success: false,
                message: 'An account with this email address already exists.',
            });
            return;
        }
        const existingEmpId = await db_1.prisma.user.findUnique({
            where: { employeeId: normalizedEmpId },
        });
        if (existingEmpId) {
            res.status(409).json({
                success: false,
                message: 'An account with this Employee ID already exists.',
            });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const newUser = await db_1.prisma.user.create({
            data: {
                employeeId: normalizedEmpId,
                fullName: fullName.trim(),
                email: normalizedEmail,
                passwordHash,
                role: 'STAFF',
                departmentId: department || null,
                site: site?.trim() || 'Hemas Hospital Wattala',
                position: position?.trim() || 'Hospital Staff',
                isActive: true,
            },
            include: { department: true },
        });
        await (0, auditService_1.logAudit)({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Registration failed.',
            error: error.message,
        });
    }
};
exports.register = register;
const login = async (req, res) => {
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
        const user = await db_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { department: true },
        });
        if (!user) {
            await (0, auditService_1.logAudit)({
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
            const minutesRemaining = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / (60 * 1000));
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
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            const newAttempts = user.failedLoginAttempts + 1;
            let lockUntil = null;
            if (newAttempts >= 5) {
                lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
            }
            await db_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newAttempts,
                    lockUntil,
                },
            });
            await (0, auditService_1.logAudit)({
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
            await db_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: 0,
                    lockUntil: null,
                },
            });
        }
        await (0, auditService_1.logAudit)({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed.',
            error: error.message,
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        if (req.user) {
            await (0, auditService_1.logAudit)({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout error.',
            error: error.message,
        });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.id },
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user profile.',
            error: error.message,
        });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const { fullName, position, site } = req.body;
        const userId = req.user.id;
        const updatedUser = await db_1.prisma.user.update({
            where: { id: userId },
            data: {
                fullName: fullName?.trim() || undefined,
                position: position?.trim() || undefined,
                site: site?.trim() || undefined,
            },
            include: { department: true },
        });
        await (0, auditService_1.logAudit)({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile.',
            error: error.message,
        });
    }
};
exports.updateProfile = updateProfile;
