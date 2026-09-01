import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/db';
import { UserRole, User, Department } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
}

export type SafeUser = User & {
  _id: string;
  department?: Department | null;
};

export interface AuthRequest extends Request {
  user?: SafeUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (err: any) {
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

    const user = await prisma.user.findUnique({
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication processing error.',
      error: error.message,
    });
  }
};
