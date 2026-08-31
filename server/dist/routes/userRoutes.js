"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Department heads can view department staff; Admins can view all and manage
router.get('/', rbac_1.requireDeptHeadOrAdmin, userController_1.getUsers);
router.get('/:id', rbac_1.requireDeptHeadOrAdmin, userController_1.getUserById);
router.post('/', rbac_1.requireAdmin, userController_1.createUser);
router.put('/:id', rbac_1.requireAdmin, userController_1.updateUser);
router.post('/:id/unlock', rbac_1.requireAdmin, userController_1.unlockUser);
exports.default = router;
