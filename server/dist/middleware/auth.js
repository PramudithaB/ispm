"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
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
        const user = await User_1.User.findById(decoded.userId).populate('department');
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
        if (user.isLocked()) {
            res.status(403).json({
                success: false,
                message: 'Account is temporarily locked due to failed login attempts.',
            });
            return;
        }
        req.user = user;
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
