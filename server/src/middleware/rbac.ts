import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '@prisma/client';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required before authorization check.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN', 'IT_SECURITY_ADMIN');
export const requireSecurityAdmin = requireRole('IT_SECURITY_ADMIN');
export const requireDeptHeadOrAdmin = requireRole('DEPARTMENT_HEAD', 'ADMIN', 'IT_SECURITY_ADMIN');
