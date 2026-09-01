import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getComplianceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();

    const [
      totalStaff,
      publishedPoliciesCount,
      publishedTrainingsCount,
      totalAcks,
      completedProgresses,
      openIncidents,
      overdueTrainings,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.policy.count({ where: { status: 'Published' } }),
      prisma.trainingModule.count({ where: { status: 'Published' } }),
      prisma.policyAcknowledgement.count(),
      prisma.trainingProgress.count({ where: { status: 'Completed' } }),
      prisma.incident.count({ where: { status: { in: ['Open', 'In Review'] } } }),
      prisma.trainingProgress.count({
        where: {
          status: { not: 'Completed' },
          dueDate: { lt: now },
        },
      }),
    ]);

    const totalPolicyExpectations = totalStaff * publishedPoliciesCount;
    const policyAckRate =
      totalPolicyExpectations > 0
        ? Math.min(100, Math.round((totalAcks / totalPolicyExpectations) * 100))
        : 100;

    const totalTrainingExpectations = totalStaff * publishedTrainingsCount;
    const trainingCompletionRate =
      totalTrainingExpectations > 0
        ? Math.min(100, Math.round((completedProgresses / totalTrainingExpectations) * 100))
        : 100;

    const overallComplianceScore = Math.round(policyAckRate * 0.5 + trainingCompletionRate * 0.5);

    res.status(200).json({
      success: true,
      summary: {
        totalStaff,
        publishedPoliciesCount,
        publishedTrainingsCount,
        policyAckRate,
        trainingCompletionRate,
        overallComplianceScore,
        openIncidents,
        overdueTrainings,
        totalAcks,
        completedProgresses,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate compliance summary from MySQL.',
      error: error.message,
    });
  }
};

export const getDepartmentCompliance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });

    const [publishedPoliciesCount, publishedTrainingsCount] = await Promise.all([
      prisma.policy.count({ where: { status: 'Published' } }),
      prisma.trainingModule.count({ where: { status: 'Published' } }),
    ]);

    const now = new Date();

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const staff = await prisma.user.findMany({
          where: { departmentId: dept.id, isActive: true },
          select: { id: true },
        });

        const staffCount = staff.length;
        const staffIds = staff.map((s) => s.id);

        if (staffCount === 0) {
          return {
            _id: dept.id,
            id: dept.id,
            name: dept.name,
            site: dept.site,
            staffCount: 0,
            policyAckRate: 100,
            trainingCompletionRate: 100,
            overallCompliance: 100,
            overdueCount: 0,
          };
        }

        const [acksCount, completionsCount, overdueCount] = await Promise.all([
          prisma.policyAcknowledgement.count({
            where: { userId: { in: staffIds } },
          }),
          prisma.trainingProgress.count({
            where: {
              userId: { in: staffIds },
              status: 'Completed',
            },
          }),
          prisma.trainingProgress.count({
            where: {
              userId: { in: staffIds },
              status: { not: 'Completed' },
              dueDate: { lt: now },
            },
          }),
        ]);

        const expectedAcks = staffCount * publishedPoliciesCount;
        const policyAckRate =
          expectedAcks > 0
            ? Math.min(100, Math.round((acksCount / expectedAcks) * 100))
            : 100;

        const expectedTrainings = staffCount * publishedTrainingsCount;
        const trainingCompletionRate =
          expectedTrainings > 0
            ? Math.min(100, Math.round((completionsCount / expectedTrainings) * 100))
            : 100;

        const overallCompliance = Math.round(
          policyAckRate * 0.5 + trainingCompletionRate * 0.5
        );

        return {
          _id: dept.id,
          id: dept.id,
          name: dept.name,
          site: dept.site,
          staffCount,
          policyAckRate,
          trainingCompletionRate,
          overallCompliance,
          overdueCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      departments: departmentStats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate department compliance statistics.',
      error: error.message,
    });
  }
};

export const getDepartmentStaffCompliance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deptId = req.params.deptId;
    const now = new Date();

    const [publishedPoliciesCount, publishedTrainingsCount, staffMembers] = await Promise.all([
      prisma.policy.count({ where: { status: 'Published' } }),
      prisma.trainingModule.count({ where: { status: 'Published' } }),
      prisma.user.findMany({
        where: { departmentId: deptId, isActive: true },
        select: {
          id: true,
          employeeId: true,
          fullName: true,
          email: true,
          position: true,
        },
        orderBy: { fullName: 'asc' },
      }),
    ]);

    const staffStats = await Promise.all(
      staffMembers.map(async (staff) => {
        const [acksCount, completionsCount, overdueCount] = await Promise.all([
          prisma.policyAcknowledgement.count({ where: { userId: staff.id } }),
          prisma.trainingProgress.count({
            where: { userId: staff.id, status: 'Completed' },
          }),
          prisma.trainingProgress.count({
            where: {
              userId: staff.id,
              status: { not: 'Completed' },
              dueDate: { lt: now },
            },
          }),
        ]);

        const policyRate =
          publishedPoliciesCount > 0
            ? Math.min(100, Math.round((acksCount / publishedPoliciesCount) * 100))
            : 100;

        const trainingRate =
          publishedTrainingsCount > 0
            ? Math.min(100, Math.round((completionsCount / publishedTrainingsCount) * 100))
            : 100;

        const overallScore = Math.round(policyRate * 0.5 + trainingRate * 0.5);

        return {
          _id: staff.id,
          id: staff.id,
          employeeId: staff.employeeId,
          fullName: staff.fullName,
          email: staff.email,
          position: staff.position,
          policyRate,
          trainingRate,
          overallScore,
          acknowledgedPoliciesCount: acksCount,
          totalPoliciesCount: publishedPoliciesCount,
          completedTrainingsCount: completionsCount,
          totalTrainingsCount: publishedTrainingsCount,
          overdueCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      staff: staffStats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate department staff compliance.',
      error: error.message,
    });
  }
};

export const getMyCompliance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const [
      publishedPoliciesCount,
      publishedTrainingsCount,
      userAcksCount,
      completedTrainingsCount,
      overdueCount,
    ] = await Promise.all([
      prisma.policy.count({ where: { status: 'Published' } }),
      prisma.trainingModule.count({ where: { status: 'Published' } }),
      prisma.policyAcknowledgement.count({ where: { userId } }),
      prisma.trainingProgress.count({
        where: { userId, status: 'Completed' },
      }),
      prisma.trainingProgress.count({
        where: {
          userId,
          status: { not: 'Completed' },
          dueDate: { lt: now },
        },
      }),
    ]);

    const policyRate =
      publishedPoliciesCount > 0
        ? Math.min(100, Math.round((userAcksCount / publishedPoliciesCount) * 100))
        : 100;

    const trainingRate =
      publishedTrainingsCount > 0
        ? Math.min(100, Math.round((completedTrainingsCount / publishedTrainingsCount) * 100))
        : 100;

    const overallScore = Math.round(policyRate * 0.5 + trainingRate * 0.5);

    res.status(200).json({
      success: true,
      myCompliance: {
        totalPolicies: publishedPoliciesCount,
        acknowledgedPolicies: userAcksCount,
        policyRate,
        totalTrainings: publishedTrainingsCount,
        completedTrainings: completedTrainingsCount,
        trainingRate,
        overallScore,
        overdueTrainings: overdueCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your compliance record from MySQL.',
      error: error.message,
    });
  }
};
