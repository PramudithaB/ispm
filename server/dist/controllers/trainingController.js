"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuiz = exports.getQuizForModule = exports.updateTraining = exports.createTraining = exports.getTrainingById = exports.getTrainings = void 0;
const db_1 = require("../config/db");
const auditService_1 = require("../services/auditService");
const getTrainings = async (req, res) => {
    try {
        const { category, search, status } = req.query;
        const user = req.user;
        const where = {};
        // Staff only sees published modules
        if (user?.role === 'STAFF') {
            where.status = 'Published';
        }
        else if (status) {
            where.status = status;
        }
        if (category)
            where.category = category;
        if (search) {
            const q = String(search);
            where.OR = [
                { title: { contains: q } },
                { description: { contains: q } },
            ];
        }
        const modules = await db_1.prisma.trainingModule.findMany({
            where,
            include: {
                createdBy: { select: { id: true, fullName: true, email: true } },
                quizzes: {
                    include: {
                        questions: { select: { id: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        let enrichedModules = modules;
        if (user) {
            const progresses = await db_1.prisma.trainingProgress.findMany({
                where: { userId: user.id },
            });
            const progressMap = new Map(progresses.map((p) => [p.trainingModuleId, p]));
            enrichedModules = modules.map((m) => {
                const progress = progressMap.get(m.id);
                let userStatus = progress?.status || 'Not Started';
                const isOverdue = m.dueDate &&
                    new Date(m.dueDate).getTime() < Date.now() &&
                    userStatus !== 'Completed';
                if (isOverdue) {
                    userStatus = 'Overdue';
                }
                return {
                    ...m,
                    _id: m.id,
                    progress: progress ? { ...progress, _id: progress.id } : null,
                    userStatus,
                    userScore: progress?.score || 0,
                    userAttempts: progress?.attempts || 0,
                    hasQuiz: !!m.quizzes,
                    questionCount: m.quizzes?.questions.length || 0,
                };
            });
        }
        else {
            enrichedModules = modules.map((m) => ({
                ...m,
                _id: m.id,
                hasQuiz: !!m.quizzes,
                questionCount: m.quizzes?.questions.length || 0,
            }));
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
        const moduleId = req.params.id;
        const module = await db_1.prisma.trainingModule.findUnique({
            where: { id: moduleId },
            include: {
                createdBy: { select: { id: true, fullName: true, email: true, position: true } },
                quizzes: {
                    include: {
                        questions: true,
                    },
                },
            },
        });
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
            progress = await db_1.prisma.trainingProgress.findUnique({
                where: {
                    userId_trainingModuleId: {
                        userId: req.user.id,
                        trainingModuleId: module.id,
                    },
                },
            });
            // If first time viewing, initialize 'In Progress' status
            if (!progress) {
                progress = await db_1.prisma.trainingProgress.create({
                    data: {
                        userId: req.user.id,
                        trainingModuleId: module.id,
                        status: 'In Progress',
                        startedAt: new Date(),
                        dueDate: module.dueDate,
                    },
                });
            }
        }
        res.status(200).json({
            success: true,
            training: {
                ...module,
                _id: module.id,
                progress: progress ? { ...progress, _id: progress.id } : null,
                hasQuiz: !!module.quizzes,
                questionCount: module.quizzes?.questions.length || 0,
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
        if (!title || !description || !content || !category) {
            res.status(400).json({
                success: false,
                message: 'Title, description, category, and content are required.',
            });
            return;
        }
        // Create module and associated quiz inside MySQL transaction
        const module = await db_1.prisma.$transaction(async (tx) => {
            const created = await tx.trainingModule.create({
                data: {
                    title: title.trim(),
                    description: description.trim(),
                    category,
                    durationMinutes: durationMinutes || 15,
                    content: content || {},
                    assignedRoles: assignedRoles || [],
                    assignedDepartmentIds: assignedDepartments || [],
                    dueDate: dueDate ? new Date(dueDate) : null,
                    passingScore: passingScore || 80,
                    status: status || 'Published',
                    createdById: req.user.id,
                },
            });
            if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
                const quiz = await tx.quiz.create({
                    data: {
                        trainingModuleId: created.id,
                        passingScore: created.passingScore,
                    },
                });
                await tx.quizQuestion.createMany({
                    data: quizQuestions.map((q, index) => ({
                        quizId: quiz.id,
                        questionId: q.questionId || `q${index + 1}`,
                        question: q.question,
                        options: q.options,
                        correctAnswer: Number(q.correctAnswer) || 0,
                        explanation: q.explanation || '',
                        orderIndex: index,
                    })),
                });
            }
            return created;
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'CREATE_TRAINING',
            module: 'TRAINING',
            entityId: module.id,
            metadata: { title: module.title, category: module.category },
            req,
        });
        res.status(201).json({
            success: true,
            message: 'Training module created successfully.',
            training: { ...module, _id: module.id },
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
        const moduleId = req.params.id;
        const { title, description, category, durationMinutes, content, assignedRoles, assignedDepartments, dueDate, passingScore, status, quizQuestions, } = req.body;
        const updatedModule = await db_1.prisma.$transaction(async (tx) => {
            const mod = await tx.trainingModule.update({
                where: { id: moduleId },
                data: {
                    title: title ? title.trim() : undefined,
                    description: description ? description.trim() : undefined,
                    category: category || undefined,
                    durationMinutes: durationMinutes || undefined,
                    content: content || undefined,
                    assignedRoles: assignedRoles || undefined,
                    assignedDepartmentIds: assignedDepartments || undefined,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    passingScore: passingScore || undefined,
                    status: status || undefined,
                },
            });
            if (quizQuestions && Array.isArray(quizQuestions)) {
                const quiz = await tx.quiz.upsert({
                    where: { trainingModuleId: mod.id },
                    update: { passingScore: mod.passingScore },
                    create: { trainingModuleId: mod.id, passingScore: mod.passingScore },
                });
                // Delete previous questions and recreate
                await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
                if (quizQuestions.length > 0) {
                    await tx.quizQuestion.createMany({
                        data: quizQuestions.map((q, index) => ({
                            quizId: quiz.id,
                            questionId: q.questionId || `q${index + 1}`,
                            question: q.question,
                            options: q.options,
                            correctAnswer: Number(q.correctAnswer) || 0,
                            explanation: q.explanation || '',
                            orderIndex: index,
                        })),
                    });
                }
            }
            return mod;
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'UPDATE_TRAINING',
            module: 'TRAINING',
            entityId: updatedModule.id,
            metadata: { title: updatedModule.title },
            req,
        });
        res.status(200).json({
            success: true,
            message: 'Training module updated successfully.',
            training: { ...updatedModule, _id: updatedModule.id },
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
// GET Quiz questions for test-taking (SANITIZED - NO ANSWER KEYS LEAKED)
const getQuizForModule = async (req, res) => {
    try {
        const moduleId = req.params.id;
        const quiz = await db_1.prisma.quiz.findUnique({
            where: { trainingModuleId: moduleId },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        if (!quiz) {
            res.status(404).json({
                success: false,
                message: 'No quiz found for this training module.',
            });
            return;
        }
        // SANITIZE: Strip correctAnswer and explanation for active test-taking
        const sanitizedQuestions = quiz.questions.map((q) => ({
            _id: q.id,
            id: q.id,
            questionId: q.questionId,
            question: q.question,
            options: q.options,
        }));
        res.status(200).json({
            success: true,
            quiz: {
                _id: quiz.id,
                id: quiz.id,
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
// SUBMIT Quiz and evaluate answers using MySQL transaction
const submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body; // Array of { questionId: string, selectedOption: number }
        const moduleId = req.params.id;
        const userId = req.user.id;
        if (!answers || !Array.isArray(answers)) {
            res.status(400).json({
                success: false,
                message: 'Please provide answers array for quiz submission.',
            });
            return;
        }
        const [module, quiz] = await Promise.all([
            db_1.prisma.trainingModule.findUnique({ where: { id: moduleId } }),
            db_1.prisma.quiz.findUnique({
                where: { trainingModuleId: moduleId },
                include: { questions: { orderBy: { orderIndex: 'asc' } } },
            }),
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
            const isCorrect = Number(ans.selectedOption) === q.correctAnswer;
            if (isCorrect)
                correctCount++;
            storedAnswers.push({
                questionId: q.questionId,
                selectedOption: Number(ans.selectedOption),
                isCorrect,
            });
            detailedResults.push({
                questionId: q.questionId,
                question: q.question,
                options: q.options,
                selectedOption: Number(ans.selectedOption),
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation,
            });
        }
        const totalQuestions = quiz.questions.length;
        const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = scorePercentage >= quiz.passingScore;
        // Record submission and update training progress inside MySQL Transaction
        const { progress, attempt } = await db_1.prisma.$transaction(async (tx) => {
            const existingProgress = await tx.trainingProgress.findUnique({
                where: {
                    userId_trainingModuleId: {
                        userId,
                        trainingModuleId: module.id,
                    },
                },
            });
            const attemptNumber = (existingProgress?.attempts || 0) + 1;
            const highestScore = Math.max(existingProgress?.score || 0, scorePercentage);
            // Create Quiz Attempt record
            const quizAttempt = await tx.quizAttempt.create({
                data: {
                    quizId: quiz.id,
                    userId,
                    attemptNumber,
                    score: scorePercentage,
                    passed,
                    answers: storedAnswers,
                },
            });
            // Update or Create Training Progress
            const updatedProgress = await tx.trainingProgress.upsert({
                where: {
                    userId_trainingModuleId: {
                        userId,
                        trainingModuleId: module.id,
                    },
                },
                update: {
                    attempts: attemptNumber,
                    score: highestScore,
                    status: passed ? 'Completed' : 'In Progress',
                    completedAt: passed ? new Date() : (existingProgress?.completedAt || null),
                },
                create: {
                    userId,
                    trainingModuleId: module.id,
                    attempts: attemptNumber,
                    score: scorePercentage,
                    status: passed ? 'Completed' : 'In Progress',
                    startedAt: new Date(),
                    completedAt: passed ? new Date() : null,
                    dueDate: module.dueDate,
                },
            });
            return { progress: updatedProgress, attempt: quizAttempt };
        });
        await (0, auditService_1.logAudit)({
            userId,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'QUIZ_SUBMISSION',
            module: 'TRAINING',
            entityId: module.id,
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
                userEmail: req.user.email,
                userRole: req.user.role,
                action: 'COMPLETE_TRAINING',
                module: 'TRAINING',
                entityId: module.id,
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
            message: 'Failed to submit quiz.',
            error: error.message,
        });
    }
};
exports.submitQuiz = submitQuiz;
