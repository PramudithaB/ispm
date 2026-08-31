"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuiz = exports.getQuizForModule = exports.updateTraining = exports.createTraining = exports.getTrainingById = exports.getTrainings = void 0;
const TrainingModule_1 = require("../models/TrainingModule");
const Quiz_1 = require("../models/Quiz");
const TrainingProgress_1 = require("../models/TrainingProgress");
const auditService_1 = require("../services/auditService");
const getTrainings = async (req, res) => {
    try {
        const { category, search, status } = req.query;
        const user = req.user;
        const filter = {};
        // Staff only sees published modules
        if (user?.role === 'STAFF') {
            filter.status = 'Published';
        }
        else if (status) {
            filter.status = status;
        }
        if (category)
            filter.category = category;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [{ title: searchRegex }, { description: searchRegex }];
        }
        const modules = await TrainingModule_1.TrainingModule.find(filter)
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });
        // Attach user's progress if authenticated
        let enrichedModules = modules.map((m) => m.toObject());
        if (user) {
            const progresses = await TrainingProgress_1.TrainingProgress.find({ userId: user._id });
            const progressMap = new Map(progresses.map((p) => [p.trainingModuleId.toString(), p]));
            enrichedModules = enrichedModules.map((m) => {
                const progress = progressMap.get(m._id.toString());
                let userStatus = progress?.status || 'Not Started';
                const isOverdue = m.dueDate &&
                    new Date(m.dueDate).getTime() < Date.now() &&
                    userStatus !== 'Completed';
                if (isOverdue) {
                    userStatus = 'Overdue';
                }
                return {
                    ...m,
                    progress: progress || null,
                    userStatus,
                    userScore: progress?.score || 0,
                    userAttempts: progress?.attempts || 0,
                };
            });
        }
        res.status(200).json({
            success: true,
            count: enrichedModules.length,
            trainings: enrichedModules,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training modules.',
            error: error.message,
        });
    }
};
exports.getTrainings = getTrainings;
const getTrainingById = async (req, res) => {
    try {
        const module = await TrainingModule_1.TrainingModule.findById(req.params.id)
            .populate('assignedDepartments', 'name site')
            .populate('createdBy', 'fullName email position');
        if (!module) {
            res.status(404).json({ success: false, message: 'Training module not found.' });
            return;
        }
        // Check staff access
        if (req.user?.role === 'STAFF' && module.status !== 'Published') {
            res.status(403).json({
                success: false,
                message: 'Access restricted: training module is not published.',
            });
            return;
        }
        let progress = null;
        if (req.user) {
            progress = await TrainingProgress_1.TrainingProgress.findOne({
                userId: req.user._id,
                trainingModuleId: module._id,
            });
            // If first time viewing, record startedAt
            if (!progress) {
                progress = await TrainingProgress_1.TrainingProgress.create({
                    userId: req.user._id,
                    trainingModuleId: module._id,
                    status: 'In Progress',
                    startedAt: new Date(),
                    dueDate: module.dueDate,
                });
            }
        }
        const quiz = await Quiz_1.Quiz.findOne({ trainingModuleId: module._id });
        res.status(200).json({
            success: true,
            training: {
                ...module.toObject(),
                progress,
                hasQuiz: !!quiz,
                questionCount: quiz?.questions.length || 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training module details.',
            error: error.message,
        });
    }
};
exports.getTrainingById = getTrainingById;
const createTraining = async (req, res) => {
    try {
        const { title, description, category, durationMinutes, content, assignedRoles, assignedDepartments, dueDate, passingScore, status, quizQuestions, } = req.body;
        if (!title || !description || !category || !content) {
            res.status(400).json({
                success: false,
                message: 'Title, Description, Category, and Content are required.',
            });
            return;
        }
        const module = await TrainingModule_1.TrainingModule.create({
            title: title.trim(),
            description: description.trim(),
            category,
            durationMinutes: durationMinutes || 15,
            content,
            assignedRoles: assignedRoles || [],
            assignedDepartments: assignedDepartments || [],
            dueDate: dueDate || null,
            passingScore: passingScore || 80,
            status: status || 'Published',
            createdBy: req.user._id,
        });
        // Create quiz if questions provided
        if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
            await Quiz_1.Quiz.create({
                trainingModuleId: module._id,
                passingScore: module.passingScore,
                questions: quizQuestions,
            });
        }
        await (0, auditService_1.logAudit)({
            userId: req.user?._id,
            userEmail: req.user?.email || 'SYSTEM',
            userRole: req.user?.role,
            action: 'CREATE_TRAINING',
            module: 'TRAINING',
            entityId: module._id.toString(),
            metadata: { title: module.title, category: module.category, questionsCount: quizQuestions?.length || 0 },
            req,
        });
        res.status(201).json({
            success: true,
            message: 'Training module and quiz created successfully.',
            training: module,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create training module.',
            error: error.message,
        });
    }
};
exports.createTraining = createTraining;
const updateTraining = async (req, res) => {
    try {
        const { title, description, category, durationMinutes, content, assignedRoles, assignedDepartments, dueDate, passingScore, status, quizQuestions, } = req.body;
        const module = await TrainingModule_1.TrainingModule.findById(req.params.id);
        if (!module) {
            res.status(404).json({ success: false, message: 'Training module not found.' });
            return;
        }
        if (title)
            module.title = title.trim();
        if (description)
            module.description = description.trim();
        if (category)
            module.category = category;
        if (durationMinutes !== undefined)
            module.durationMinutes = durationMinutes;
        if (content)
            module.content = content;
        if (assignedRoles !== undefined)
            module.assignedRoles = assignedRoles;
        if (assignedDepartments !== undefined)
            module.assignedDepartments = assignedDepartments;
        if (dueDate !== undefined)
            module.dueDate = dueDate;
        if (passingScore !== undefined)
            module.passingScore = passingScore;
        if (status)
            module.status = status;
        await module.save();
        if (quizQuestions && Array.isArray(quizQuestions)) {
            await Quiz_1.Quiz.findOneAndUpdate({ trainingModuleId: module._id }, {
                passingScore: module.passingScore,
                questions: quizQuestions,
            }, { upsert: true, new: true });
        }
        await (0, auditService_1.logAudit)({
            userId: req.user?._id,
            userEmail: req.user?.email || 'SYSTEM',
            userRole: req.user?.role,
            action: 'UPDATE_TRAINING',
            module: 'TRAINING',
            entityId: module._id.toString(),
            metadata: { title: module.title },
            req,
        });
        res.status(200).json({
            success: true,
            message: 'Training module updated successfully.',
            training: module,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update training module.',
            error: error.message,
        });
    }
};
exports.updateTraining = updateTraining;
// GET Quiz questions for staff (SANITIZED - NO ANSWER KEYS LEAKED)
const getQuizForModule = async (req, res) => {
    try {
        const quiz = await Quiz_1.Quiz.findOne({ trainingModuleId: req.params.id });
        if (!quiz) {
            res.status(404).json({
                success: false,
                message: 'No quiz found for this training module.',
            });
            return;
        }
        // SANITIZE: Strip correctAnswer and explanation for active test-taking
        const sanitizedQuestions = quiz.questions.map((q) => ({
            questionId: q.questionId,
            question: q.question,
            options: q.options,
        }));
        res.status(200).json({
            success: true,
            quiz: {
                trainingModuleId: quiz.trainingModuleId,
                passingScore: quiz.passingScore,
                questionCount: sanitizedQuestions.length,
                questions: sanitizedQuestions,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz.',
            error: error.message,
        });
    }
};
exports.getQuizForModule = getQuizForModule;
// SUBMIT Quiz and evaluate answers
const submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body; // Array of { questionId: string, selectedOption: number }
        const moduleId = req.params.id;
        const userId = req.user._id;
        if (!answers || !Array.isArray(answers)) {
            res.status(400).json({
                success: false,
                message: 'Please provide answers array for quiz submission.',
            });
            return;
        }
        const [module, quiz] = await Promise.all([
            TrainingModule_1.TrainingModule.findById(moduleId),
            Quiz_1.Quiz.findOne({ trainingModuleId: moduleId }),
        ]);
        if (!module || !quiz) {
            res.status(404).json({
                success: false,
                message: 'Training module or associated quiz not found.',
            });
            return;
        }
        const questionMap = new Map(quiz.questions.map((q) => [q.questionId, q]));
        let correctCount = 0;
        const detailedResults = [];
        const storedAnswers = [];
        for (const ans of answers) {
            const q = questionMap.get(ans.questionId);
            if (!q)
                continue;
            const isCorrect = ans.selectedOption === q.correctAnswer;
            if (isCorrect)
                correctCount++;
            storedAnswers.push({
                questionId: q.questionId,
                selectedOption: ans.selectedOption,
                isCorrect,
            });
            // Include answers and explanations ONLY after evaluation
            detailedResults.push({
                questionId: q.questionId,
                question: q.question,
                options: q.options,
                selectedOption: ans.selectedOption,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation,
            });
        }
        const totalQuestions = quiz.questions.length;
        const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = scorePercentage >= quiz.passingScore;
        let progress = await TrainingProgress_1.TrainingProgress.findOne({
            userId,
            trainingModuleId: module._id,
        });
        if (!progress) {
            progress = new TrainingProgress_1.TrainingProgress({
                userId,
                trainingModuleId: module._id,
                startedAt: new Date(),
                dueDate: module.dueDate,
            });
        }
        progress.attempts = (progress.attempts || 0) + 1;
        progress.score = Math.max(progress.score || 0, scorePercentage); // keep highest score
        progress.quizAnswers = storedAnswers;
        if (passed) {
            progress.status = 'Completed';
            progress.completedAt = new Date();
        }
        else {
            progress.status = 'In Progress';
        }
        await progress.save();
        await (0, auditService_1.logAudit)({
            userId,
            userEmail: req.user?.email || 'SYSTEM',
            userRole: req.user?.role,
            action: 'QUIZ_SUBMISSION',
            module: 'TRAINING',
            entityId: module._id.toString(),
            metadata: {
                trainingTitle: module.title,
                score: scorePercentage,
                passed,
                attempt: progress.attempts,
            },
            req,
        });
        if (passed) {
            await (0, auditService_1.logAudit)({
                userId,
                userEmail: req.user?.email || 'SYSTEM',
                userRole: req.user?.role,
                action: 'COMPLETE_TRAINING',
                module: 'TRAINING',
                entityId: module._id.toString(),
                metadata: {
                    trainingTitle: module.title,
                    finalScore: scorePercentage,
                },
                req,
            });
        }
        res.status(200).json({
            success: true,
            message: passed
                ? `Congratulations! You passed the quiz with ${scorePercentage}%.`
                : `You scored ${scorePercentage}%. Passing score is ${quiz.passingScore}%. You can review the explanations and try again.`,
            result: {
                passed,
                score: scorePercentage,
                passingScore: quiz.passingScore,
                correctCount,
                totalQuestions,
                attempts: progress.attempts,
                completedAt: progress.completedAt,
                questions: detailedResults,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to evaluate quiz submission.',
            error: error.message,
        });
    }
};
exports.submitQuiz = submitQuiz;
