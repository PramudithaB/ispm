import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

// Helper to safely parse content (whether JSON object or string)
const parseContent = (content: any): any => {
  if (!content) return { introduction: '', sections: [] };
  if (typeof content === 'object') return content;
  try {
    return JSON.parse(content);
  } catch {
    return {
      introduction: String(content),
      sections: [{ title: 'Module Content', body: String(content), highlights: [] }],
    };
  }
};

// Helper to safely parse JSON arrays
const parseJsonArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// GET all training modules
export const getTrainings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, status } = req.query;
    const user = req.user;

    const where: any = {};

    // Staff only sees published modules
    if (user?.role === 'STAFF') {
      where.status = 'Published';
    } else if (status) {
      where.status = status as string;
    }

    if (category) where.category = category as string;
    if (search) {
      const q = String(search);
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const modules = await prisma.trainingModule.findMany({
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

    let enrichedModules: any[] = modules;

    if (user) {
      const progresses = await prisma.trainingProgress.findMany({
        where: { userId: user.id },
      });

      const progressMap = new Map(
        progresses.map((p) => [p.trainingModuleId, p])
      );

      enrichedModules = modules.map((m) => {
        const progress = progressMap.get(m.id);
        let userStatus = progress?.status || 'Not Started';
        const isOverdue =
          m.dueDate &&
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
    } else {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training modules.',
      error: error.message,
    });
  }
};

// GET training module details by ID
export const getTrainingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;

    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true, position: true } },
        quizzes: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
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

    let progress: any = null;
    if (req.user) {
      progress = await prisma.trainingProgress.findUnique({
        where: {
          userId_trainingModuleId: {
            userId: req.user.id,
            trainingModuleId: module.id,
          },
        },
      });

      // If first time viewing, initialize 'In Progress' status
      if (!progress) {
        progress = await prisma.trainingProgress.create({
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training module details.',
      error: error.message,
    });
  }
};

// CREATE a training module (Admin / IT Security)
export const createTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      durationMinutes,
      content,
      assignedRoles,
      assignedDepartments,
      dueDate,
      passingScore,
      status,
      quizQuestions,
    } = req.body;

    if (!title || !description || !category) {
      res.status(400).json({
        success: false,
        message: 'Module title, description, and category are required.',
      });
      return;
    }

    // Handle PDF upload if provided
    let pdfFileName: string | null = null;
    let pdfFilePath: string | null = null;
    if (req.file) {
      pdfFileName = req.file.originalname;
      pdfFilePath = `/uploads/trainings/${req.file.filename}`;
    }

    const parsedContent = parseContent(content || description);
    const parsedRoles = parseJsonArray(assignedRoles);
    const parsedDepts = parseJsonArray(assignedDepartments);
    const parsedQuestions = parseJsonArray(quizQuestions);

    const module = await prisma.$transaction(async (tx) => {
      const created = await tx.trainingModule.create({
        data: {
          title: String(title).trim(),
          description: String(description).trim(),
          category: String(category).trim(),
          durationMinutes: parseInt(String(durationMinutes || '15'), 10),
          content: parsedContent,
          assignedRoles: parsedRoles.length > 0 ? parsedRoles : ['STAFF', 'DEPARTMENT_HEAD', 'ADMIN', 'IT_SECURITY_ADMIN'],
          assignedDepartmentIds: parsedDepts.length > 0 ? parsedDepts : undefined,
          dueDate: dueDate ? new Date(dueDate) : null,
          passingScore: parseInt(String(passingScore || '70'), 10),
          status: status || 'Published',
          pdfFileName,
          pdfFilePath,
          createdById: req.user!.id,
        },
      });

      if (parsedQuestions.length > 0) {
        const quiz = await tx.quiz.create({
          data: {
            trainingModuleId: created.id,
            passingScore: created.passingScore,
          },
        });

        await tx.quizQuestion.createMany({
          data: parsedQuestions.map((q: any, index: number) => ({
            quizId: quiz.id,
            questionId: q.questionId || `q${index + 1}`,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || ''],
            correctAnswer: Number(q.correctAnswer) || 0,
            explanation: q.explanation || '',
            orderIndex: index,
          })),
        });
      }

      return created;
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'CREATE_TRAINING',
      module: 'TRAINING',
      entityId: module.id,
      metadata: { title: module.title, category: module.category, hasPdf: !!pdfFilePath },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Training module created successfully.',
      training: { ...module, _id: module.id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create training module.',
      error: error.message,
    });
  }
};

// UPDATE a training module (Admin / IT Security)
export const updateTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;
    const {
      title,
      description,
      category,
      durationMinutes,
      content,
      assignedRoles,
      assignedDepartments,
      dueDate,
      passingScore,
      status,
      quizQuestions,
      removePdf,
    } = req.body;

    const existing = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Training module not found.' });
      return;
    }

    let pdfFileName: string | undefined = undefined;
    let pdfFilePath: string | undefined = undefined;

    // If new PDF is uploaded
    if (req.file) {
      // Remove old file from disk if present
      if (existing.pdfFilePath) {
        const oldPath = path.resolve(__dirname, '../../', existing.pdfFilePath.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }
      pdfFileName = req.file.originalname;
      pdfFilePath = `/uploads/trainings/${req.file.filename}`;
    } else if (removePdf === 'true' || removePdf === true) {
      if (existing.pdfFilePath) {
        const oldPath = path.resolve(__dirname, '../../', existing.pdfFilePath.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }
      pdfFileName = null as any;
      pdfFilePath = null as any;
    }

    const updatedModule = await prisma.$transaction(async (tx) => {
      const mod = await tx.trainingModule.update({
        where: { id: moduleId },
        data: {
          title: title ? String(title).trim() : undefined,
          description: description ? String(description).trim() : undefined,
          category: category ? String(category).trim() : undefined,
          durationMinutes: durationMinutes ? parseInt(String(durationMinutes), 10) : undefined,
          content: content ? parseContent(content) : undefined,
          assignedRoles: assignedRoles ? parseJsonArray(assignedRoles) : undefined,
          assignedDepartmentIds: assignedDepartments ? parseJsonArray(assignedDepartments) : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          passingScore: passingScore ? parseInt(String(passingScore), 10) : undefined,
          status: status || undefined,
          pdfFileName,
          pdfFilePath,
        },
      });

      if (quizQuestions) {
        const parsedQuestions = parseJsonArray(quizQuestions);
        const quiz = await tx.quiz.upsert({
          where: { trainingModuleId: mod.id },
          update: { passingScore: mod.passingScore },
          create: { trainingModuleId: mod.id, passingScore: mod.passingScore },
        });

        await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

        if (parsedQuestions.length > 0) {
          await tx.quizQuestion.createMany({
            data: parsedQuestions.map((q: any, index: number) => ({
              quizId: quiz.id,
              questionId: q.questionId || `q${index + 1}`,
              question: q.question,
              options: Array.isArray(q.options) ? q.options : [q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || ''],
              correctAnswer: Number(q.correctAnswer) || 0,
              explanation: q.explanation || '',
              orderIndex: index,
            })),
          });
        }
      }

      return mod;
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update training module.',
      error: error.message,
    });
  }
};

// DELETE a training module (Admin / IT Security)
export const deleteTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;

    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      res.status(404).json({ success: false, message: 'Training module not found.' });
      return;
    }

    // Delete PDF from disk if present
    if (module.pdfFilePath) {
      const filePath = path.resolve(__dirname, '../../', module.pdfFilePath.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }

    // Delete training module from MySQL (cascades to quizzes, questions, attempts, progress)
    await prisma.trainingModule.delete({
      where: { id: moduleId },
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'DELETE_TRAINING',
      module: 'TRAINING',
      entityId: moduleId,
      metadata: { title: module.title },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Training module "${module.title}" deleted successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete training module.',
      error: error.message,
    });
  }
};

// GET Admin Quiz (includes answers and explanations for editing)
export const getAdminQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;

    const quiz = await prisma.quiz.findUnique({
      where: { trainingModuleId: moduleId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!quiz) {
      res.status(200).json({
        success: true,
        quiz: null,
        message: 'No quiz has been created for this module yet.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      quiz: {
        ...quiz,
        _id: quiz.id,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quiz for administration.',
      error: error.message,
    });
  }
};

// SAVE / UPDATE Admin Quiz (Questions with Option A, B, C, D and correct answer)
export const saveAdminQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;
    const { passingScore, questions } = req.body;

    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      res.status(404).json({ success: false, message: 'Training module not found.' });
      return;
    }

    const parsedQuestions = Array.isArray(questions) ? questions : parseJsonArray(questions);

    const savedQuiz = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.upsert({
        where: { trainingModuleId: moduleId },
        update: {
          passingScore: passingScore ? parseInt(String(passingScore), 10) : module.passingScore,
        },
        create: {
          trainingModuleId: moduleId,
          passingScore: passingScore ? parseInt(String(passingScore), 10) : module.passingScore,
        },
      });

      // Remove existing questions and re-insert
      await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

      if (parsedQuestions.length > 0) {
        await tx.quizQuestion.createMany({
          data: parsedQuestions.map((q: any, index: number) => ({
            quizId: quiz.id,
            questionId: q.questionId || `q${index + 1}`,
            question: q.question || `Question ${index + 1}`,
            options: Array.isArray(q.options)
              ? q.options
              : [q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || ''],
            correctAnswer: Number(q.correctAnswer) || 0,
            explanation: q.explanation || '',
            orderIndex: index,
          })),
        });
      }

      return await tx.quiz.findUnique({
        where: { id: quiz.id },
        include: { questions: { orderBy: { orderIndex: 'asc' } } },
      });
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'SAVE_QUIZ',
      module: 'TRAINING',
      entityId: moduleId,
      metadata: { questionCount: parsedQuestions.length },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Quiz saved successfully.',
      quiz: savedQuiz,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to save quiz.',
      error: error.message,
    });
  }
};

// DELETE Quiz for a training module (Admin / IT Security)
export const deleteQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;

    const quiz = await prisma.quiz.findUnique({
      where: { trainingModuleId: moduleId },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found for this training module.' });
      return;
    }

    await prisma.quiz.delete({
      where: { id: quiz.id },
    });

    await logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'DELETE_QUIZ',
      module: 'TRAINING',
      entityId: moduleId,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz.',
      error: error.message,
    });
  }
};

// GET Quiz questions for test-taking (SANITIZED - NO ANSWER KEYS LEAKED)
export const getQuizForModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;

    const quiz = await prisma.quiz.findUnique({
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz.',
      error: error.message,
    });
  }
};

// SUBMIT Quiz and evaluate answers using MySQL transaction
export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answers } = req.body; // Array of { questionId: string, selectedOption: number }
    const moduleId = req.params.id;
    const userId = req.user!.id;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        message: 'Please provide answers array for quiz submission.',
      });
      return;
    }

    const [module, quiz] = await Promise.all([
      prisma.trainingModule.findUnique({ where: { id: moduleId } }),
      prisma.quiz.findUnique({
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
    const detailedResults: any[] = [];
    const storedAnswers: any[] = [];

    for (const ans of answers) {
      const q = questionMap.get(ans.questionId);
      if (!q) continue;

      const isCorrect = Number(ans.selectedOption) === q.correctAnswer;
      if (isCorrect) correctCount++;

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
    const { progress, attempt } = await prisma.$transaction(async (tx) => {
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
          status: passed ? 'Completed' : 'Not Completed',
          completedAt: passed ? new Date() : (existingProgress?.completedAt || null),
        },
        create: {
          userId,
          trainingModuleId: module.id,
          attempts: attemptNumber,
          score: scorePercentage,
          status: passed ? 'Completed' : 'Not Completed',
          startedAt: new Date(),
          completedAt: passed ? new Date() : null,
          dueDate: module.dueDate,
        },
      });

      return { progress: updatedProgress, attempt: quizAttempt };
    });

    await logAudit({
      userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
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
      await logAudit({
        userId,
        userEmail: req.user!.email,
        userRole: req.user!.role,
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz.',
      error: error.message,
    });
  }
};
