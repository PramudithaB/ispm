"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const db_1 = require("../config/db");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Authentication required. No token provided.',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Invalid authorization token format.',
            });
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Authentication token has expired. Please log in again.',
                    isExpired: true,
                });
                return;
            }
            res.status(401).json({
                success: false,
                message: 'Invalid token authentication failed.',
            });
            return;
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { department: true },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User associated with this token no longer exists.',
            });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                message: 'This user account has been deactivated. Please contact IT Security.',
            });
            return;
        }
        // Check account lockout
        if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
            res.status(403).json({
                success: false,
                message: 'Account is temporarily locked due to failed login attempts.',
            });
            return;
        }
        // Attach user with compatibility _id
        req.user = {
            ...user,
            _id: user.id,
        };
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authentication processing error.',
            error: error.message,
        });
    }
};
exports.authenticate = authenticate;
