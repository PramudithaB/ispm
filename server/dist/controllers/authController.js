"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.logout = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const env_1 = require("../config/env");
const auditService_1 = require("../services/auditService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        userId: user._id,
        email: user.email,
        role: user.role,
        departmentId: user.department ? user.department.toString() : null,
    }, env_1.config.jwtSecret, { expiresIn: '7d' });
};
const login = async (req, res) => {
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
        const user = await User_1.User.findOne({ email: normalizedEmail })
            .select('+passwordHash')
            .populate('department');
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
                message: 'Invalid email address or password.',
            });
            return;
        }
        // Check if account is locked
        if (user.isLocked()) {
            const lockMinutesRemaining = Math.ceil(((user.lockUntil?.getTime() || 0) - Date.now()) / 60000);
            await (0, auditService_1.logAudit)({
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
            await (0, auditService_1.logAudit)({
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
                await (0, auditService_1.logAudit)({
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
            await (0, auditService_1.logAudit)({
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
                message: user.failedLoginAttempts >= 5
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
        await (0, auditService_1.logAudit)({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login processing error.',
            error: error.message,
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        if (req.user) {
            await (0, auditService_1.logAudit)({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout processing error.',
            error: error.message,
        });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        res.status(200).json({
            success: true,
            user: req.user,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current user profile.',
            error: error.message,
        });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { fullName, currentPassword, newPassword } = req.body;
        const user = await User_1.User.findById(req.user._id).select('+passwordHash');
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
            user.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        }
        await user.save();
        await (0, auditService_1.logAudit)({
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
