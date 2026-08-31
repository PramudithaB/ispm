"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDeptHeadOrAdmin = exports.requireSecurityAdmin = exports.requireAdmin = exports.requireRole = void 0;
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('ADMIN', 'IT_SECURITY_ADMIN');
exports.requireSecurityAdmin = (0, exports.requireRole)('IT_SECURITY_ADMIN');
exports.requireDeptHeadOrAdmin = (0, exports.requireRole)('DEPARTMENT_HEAD', 'ADMIN', 'IT_SECURITY_ADMIN');
