import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const getIncidents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, incidentType, search } = req.query;
    const user = req.user;

    const where: any = {};

    // Staff only sees incidents they reported
    if (user?.role === 'STAFF') {
      where.reportedById = user.id;
    } else if (user?.role === 'DEPARTMENT_HEAD' && user.departmentId) {
      where.departmentId = user.departmentId;
    }

    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (incidentType) where.incidentType = incidentType as string;

    if (search) {
      const q = String(search);
      where.OR = [
        { incidentNumber: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reportedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeId: true,
            position: true,
            site: true,
            department: { select: { id: true, name: true, site: true } },
          },
        },
        assignedTo: {
          select: { id: true, fullName: true, email: true, position: true },
        },
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents: incidents.map((inc) => ({
        ...inc,
        _id: inc.id,
        reportedBy: inc.reportedBy ? { ...inc.reportedBy, _id: inc.reportedBy.id } : null,
        assignedTo: inc.assignedTo ? { ...inc.assignedTo, _id: inc.assignedTo.id } : null,
        department: inc.department ? { ...inc.department, _id: inc.department.id } : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents.',
      error: error.message,
    });
  }
};

export const getIncidentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: {
        reportedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeId: true,
            position: true,
            site: true,
            department: { select: { id: true, name: true, site: true } },
          },
        },
        assignedTo: {
          select: { id: true, fullName: true, email: true, position: true },
        },
        department: true,
      },
    });

    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found.' });
      return;
    }

    // Authorization check for Staff
    if (req.user?.role === 'STAFF' && incident.reportedById !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Access restricted: you can only view incidents reported by you.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      incident: {
        ...incident,
        _id: incident.id,
        reportedBy: incident.reportedBy ? { ...incident.reportedBy, _id: incident.reportedBy.id } : null,
        assignedTo: incident.assignedTo ? { ...incident.assignedTo, _id: incident.assignedTo.id } : null,
        department: incident.department ? { ...incident.department, _id: incident.department.id } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incident details.',
      error: error.message,
    });
  }
};

export const reportIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { incidentType, title, description, priority } = req.body;
    const user = req.user!;

    if (!incidentType || !title || !description) {
      res.status(400).json({
        success: false,
        message: 'Incident Type, Title, and Description are required.',
      });
      return;
    }

    // Generate sequential incident number
    const count = await prisma.incident.count();
    const year = new Date().getFullYear();
    const incidentNumber = `INC-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const incident = await prisma.incident.create({
      data: {
        incidentNumber,
        reportedById: user.id,
        incidentType,
        title: title.trim(),
        description: description.trim(),
        priority: priority || 'Medium',
        status: 'Open',
        departmentId: user.departmentId || null,
        notes: [],
      },
      include: {
        reportedBy: { select: { id: true, fullName: true, email: true } },
        department: true,
      },
    });

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE_INCIDENT',
      module: 'INCIDENTS',
      entityId: incident.id,
      metadata: {
        incidentNumber: incident.incidentNumber,
        type: incident.incidentType,
        priority: incident.priority,
      },
      req,
    });

    // Notify Security Admins about new incident
    const securityAdmins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'IT_SECURITY_ADMIN'] }, isActive: true },
      select: { id: true },
    });

    if (securityAdmins.length > 0) {
      await prisma.notification.createMany({
        data: securityAdmins.map((admin) => ({
          userId: admin.id,
          title: `New Security Incident: ${incident.incidentNumber}`,
          message: `[${incident.priority} Priority] "${incident.title}" was reported by ${user.fullName}.`,
          type: 'incident',
          link: `/incidents/${incident.id}`,
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: `Incident ${incident.incidentNumber} reported successfully to IT Cyber Defense.`,
      incident: {
        ...incident,
        _id: incident.id,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to report security incident.',
      error: error.message,
    });
  }
};

// Update incident status, assignee, and notes using MySQL Transaction
export const updateIncidentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incidentId = req.params.id;
    const { status, priority, assignedTo, resolutionNotes, note } = req.body;
    const user = req.user!;

    const updatedIncident = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.findUnique({
        where: { id: incidentId },
      });

      if (!incident) throw new Error('Incident not found');

      const existingNotes = Array.isArray(incident.notes) ? (incident.notes as any[]) : [];
      if (note && note.trim()) {
        existingNotes.push({
          authorId: user.id,
          authorName: user.fullName,
          authorRole: user.role,
          note: note.trim(),
          createdAt: new Date().toISOString(),
        });
      }

      const isResolving = status === 'Resolved' && incident.status !== 'Resolved';
      const resolvedAt = isResolving ? new Date() : (status && status !== 'Resolved' ? null : incident.resolvedAt);

      const updated = await tx.incident.update({
        where: { id: incidentId },
        data: {
          status: status || undefined,
          priority: priority || undefined,
          assignedToId: assignedTo !== undefined ? assignedTo || null : undefined,
          resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : undefined,
          notes: existingNotes,
          resolvedAt,
        },
        include: {
          reportedBy: { select: { id: true, fullName: true, email: true } },
          assignedTo: { select: { id: true, fullName: true, email: true } },
          department: true,
        },
      });

      // Notify the reporter if status updated
      if (status && status !== incident.status) {
        await tx.notification.create({
          data: {
            userId: incident.reportedById,
            title: `Incident ${incident.incidentNumber} Updated`,
            message: `Status changed to "${status}" by ${user.fullName}.`,
            type: 'incident',
            link: `/incidents/${incident.id}`,
          },
        });
      }

      return updated;
    });

    const isResolved = updatedIncident.status === 'Resolved';
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: isResolved ? 'RESOLVE_INCIDENT' : 'UPDATE_INCIDENT',
      module: 'INCIDENTS',
      entityId: updatedIncident.id,
      metadata: {
        incidentNumber: updatedIncident.incidentNumber,
        newStatus: updatedIncident.status,
        newPriority: updatedIncident.priority,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Incident status updated successfully.',
      incident: {
        ...updatedIncident,
        _id: updatedIncident.id,
      },
    });
  } catch (error: any) {
    res.status(error.message === 'Incident not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to update incident status.',
    });
  }
};
