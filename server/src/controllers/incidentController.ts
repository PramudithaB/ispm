import { Response } from 'express';
import { Incident, IIncident } from '../models/Incident';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const getIncidents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, incidentType, search } = req.query;
    const user = req.user;

    const filter: any = {};

    // Staff only sees incidents they reported
    if (user?.role === 'STAFF') {
      filter.reportedBy = user._id;
    } else if (user?.role === 'DEPARTMENT_HEAD' && user.department) {
      filter.department = user.department;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (incidentType) filter.incidentType = incidentType;

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { incidentNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'fullName email employeeId position department site')
      .populate('assignedTo', 'fullName email position')
      .populate('department', 'name site')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
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
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'fullName email employeeId position department site')
      .populate('assignedTo', 'fullName email position')
      .populate('department', 'name site')
      .populate('notes.author', 'fullName role');

    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found.' });
      return;
    }

    // Authorization check for Staff
    if (
      req.user?.role === 'STAFF' &&
      incident.reportedBy._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Access restricted: you can only view incidents reported by you.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      incident,
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

    // Generate unique incident number e.g. INC-2026-1042
    const count = await Incident.countDocuments();
    const year = new Date().getFullYear();
    const incidentNumber = `INC-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const incident = await Incident.create({
      incidentNumber,
      reportedBy: user._id,
      incidentType,
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'Medium',
      status: 'Open',
      department: user.department || null,
      notes: [],
    });

    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE_INCIDENT',
      module: 'INCIDENTS',
      entityId: incident._id.toString(),
      metadata: {
        incidentNumber,
        incidentType,
        priority: incident.priority,
      },
      req,
    });

    // Notify Security Admins about new incident
    const securityAdmins = await User.find({
      role: { $in: ['IT_SECURITY_ADMIN', 'ADMIN'] },
      isActive: true,
    }).select('_id');

    const adminNotifications = securityAdmins.map((admin) => ({
      userId: admin._id,
      title: `🚨 New Security Incident Reported: ${incidentNumber}`,
      message: `${user.fullName} reported a ${incident.priority} priority incident (${incidentType}): "${title}".`,
      type: 'incident',
      link: `/incidents/${incident._id}`,
    }));

    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({
      success: true,
      message: `Incident ${incidentNumber} reported successfully. IT Security has been notified.`,
      incident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to report incident.',
      error: error.message,
    });
  }
};

export const updateIncidentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, resolutionNotes, assignedTo, note } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found.' });
      return;
    }

    const previousStatus = incident.status;

    if (status) {
      incident.status = status;
      if (status === 'Resolved') {
        incident.resolvedAt = new Date();
      }
    }

    if (resolutionNotes) {
      incident.resolutionNotes = resolutionNotes.trim();
    }

    if (assignedTo !== undefined) {
      incident.assignedTo = assignedTo || null;
    }

    if (note && note.trim()) {
      incident.notes.push({
        author: req.user!._id,
        note: note.trim(),
        createdAt: new Date(),
      });
    }

    await incident.save();

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: status === 'Resolved' ? 'RESOLVE_INCIDENT' : 'UPDATE_INCIDENT',
      module: 'INCIDENTS',
      entityId: incident._id.toString(),
      metadata: {
        incidentNumber: incident.incidentNumber,
        previousStatus,
        newStatus: incident.status,
        assignedTo,
      },
      req,
    });

    // Notify the reporter if status changed
    if (status && status !== previousStatus) {
      await Notification.create({
        userId: incident.reportedBy,
        title: `Incident ${incident.incidentNumber} Status Update`,
        message: `Your reported security incident is now "${incident.status}".`,
        type: 'incident',
        link: `/incidents/${incident._id}`,
      });
    }

    const populated = await Incident.findById(incident._id)
      .populate('reportedBy', 'fullName email employeeId position department')
      .populate('assignedTo', 'fullName email position')
      .populate('notes.author', 'fullName role');

    res.status(200).json({
      success: true,
      message: `Incident ${incident.incidentNumber} updated to ${incident.status}.`,
      incident: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update incident.',
      error: error.message,
    });
  }
};
