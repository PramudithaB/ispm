"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmentController_1 = require("../controllers/departmentController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Public endpoint for registration form
router.get('/public', departmentController_1.getDepartments);
router.use(auth_1.authenticate);
router.get('/', departmentController_1.getDepartments);
router.post('/', rbac_1.requireAdmin, departmentController_1.createDepartment);
router.put('/:id', rbac_1.requireAdmin, departmentController_1.updateDepartment);
router.delete('/:id', rbac_1.requireAdmin, departmentController_1.deleteDepartment);
exports.default = router;
