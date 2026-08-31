import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, IUser, UserRole } from '../models/User';
import { Types } from 'mongoose';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
}

export interface AuthRequest extends Request {
  user?: IUser & { _id: Types.ObjectId };
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

    const user = await User.findById(decoded.userId).populate('department');
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

    req.user = user as unknown as IUser & { _id: Types.ObjectId };
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication processing error.',
      error: error.message,
    });
  }
};
