"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const departmentRoutes_1 = __importDefault(require("./departmentRoutes"));
const policyRoutes_1 = __importDefault(require("./policyRoutes"));
const trainingRoutes_1 = __importDefault(require("./trainingRoutes"));
const complianceRoutes_1 = __importDefault(require("./complianceRoutes"));
const incidentRoutes_1 = __importDefault(require("./incidentRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const auditRoutes_1 = __importDefault(require("./auditRoutes"));
const reportRoutes_1 = __importDefault(require("./reportRoutes"));
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.use('/users', userRoutes_1.default);
router.use('/departments', departmentRoutes_1.default);
router.use('/policies', policyRoutes_1.default);
router.use('/training', trainingRoutes_1.default);
router.use('/compliance', complianceRoutes_1.default);
router.use('/incidents', incidentRoutes_1.default);
router.use('/notifications', notificationRoutes_1.default);
router.use('/audit-logs', auditRoutes_1.default);
router.use('/reports', reportRoutes_1.default);
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        service: 'SecureHemas API',
        timestamp: new Date(),
        version: '1.0.0',
    });
});
exports.default = router;
