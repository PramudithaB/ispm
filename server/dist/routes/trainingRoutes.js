"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trainingController_1 = require("../controllers/trainingController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', trainingController_1.getTrainings);
router.get('/:id', trainingController_1.getTrainingById);
router.post('/', rbac_1.requireAdmin, trainingController_1.createTraining);
router.put('/:id', rbac_1.requireAdmin, trainingController_1.updateTraining);
// Quiz routes
router.get('/:id/quiz', trainingController_1.getQuizForModule);
router.post('/:id/submit-quiz', trainingController_1.submitQuiz);
exports.default = router;
