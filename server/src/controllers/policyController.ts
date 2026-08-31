import { Response } from 'express';
import { Policy, IPolicy } from '../models/Policy';
import { PolicyAcknowledgement } from '../models/PolicyAcknowledgement';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const getPolicies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, department, search, status } = req.query;
    const user = req.user;

    const filter: any = {};

    // Staff can ONLY see Published policies
    if (user?.role === 'STAFF') {
      filter.status = 'Published';
    } else if (status) {
      filter.status = status;
    }

    if (category) filter.category = category;
    if (department) filter.department = department;

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }, { content: searchRegex }];
    }

    const policies = await Policy.find(filter)
      .populate('department', 'name site')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .sort({ updatedAt: -1 });

    // For each policy, check if the current user has acknowledged the current version
    let enrichedPolicies: any[] = policies.map((p) => p.toObject());

    if (user) {
      const userAcks = await PolicyAcknowledgement.find({
        userId: user._id,
      });

      const ackMap = new Set(
        userAcks.map((ack) => `${ack.policyId.toString()}_${ack.policyVersion}`)
      );

      enrichedPolicies = enrichedPolicies.map((p) => {
        const isAcknowledged = ackMap.has(`${p._id.toString()}_${p.version}`);
        return {
          ...p,
          isAcknowledged,
        };
      });
    }

    res.status(200).json({
      success: true,
      count: enrichedPolicies.length,
      policies: enrichedPolicies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies.',
      error: error.message,
    });
  }
};

export const getPolicyById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('department', 'name site')
      .populate('createdBy', 'fullName email position')
      .populate('updatedBy', 'fullName email position');

    if (!policy) {
      res.status(404).json({ success: false, message: 'Policy not found.' });
      return;
    }

    // Check if staff can access (only published)
    if (req.user?.role === 'STAFF' && policy.status !== 'Published') {
      res.status(403).json({
        success: false,
        message: 'Access restricted: this policy draft is not yet published.',
      });
      return;
    }

    let isAcknowledged = false;
    let acknowledgementDetails = null;

    if (req.user) {
      const ack = await PolicyAcknowledgement.findOne({
        policyId: policy._id,
        policyVersion: policy.version,
        userId: req.user._id,
      });

      if (ack) {
        isAcknowledged = true;
        acknowledgementDetails = ack;
      }
    }

    res.status(200).json({
      success: true,
      policy: {
        ...policy.toObject(),
        isAcknowledged,
        acknowledgementDetails,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy details.',
      error: error.message,
    });
  }
};

export const createPolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, content, category, department, effectiveDate, status, version } = req.body;

    if (!title || !description || !content || !category) {
      res.status(400).json({
        success: false,
        message: 'Title, Description, Content, and Category are required.',
      });
      return;
    }

    const policy = await Policy.create({
      title: title.trim(),
      description: description.trim(),
      content,
      category,
      department: department || null,
      effectiveDate: effectiveDate || new Date(),
      status: status || 'Draft',
      version: version || '1.0',
      publishedAt: status === 'Published' ? new Date() : null,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
      previousVersions: [],
    });

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'CREATE_POLICY',
      module: 'POLICIES',
      entityId: policy._id.toString(),
      metadata: { title: policy.title, version: policy.version, status: policy.status },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Policy created successfully.',
      policy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create policy.',
      error: error.message,
    });
  }
};

export const updatePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, content, category, department, changelog, newVersion, status } = req.body;
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      res.status(404).json({ success: false, message: 'Policy not found.' });
      return;
    }

    // If updating content or major fields, archive the existing version
    if (newVersion && newVersion !== policy.version) {
      policy.previousVersions.push({
        version: policy.version,
        title: policy.title,
        content: policy.content,
        changelog: policy.changelog || 'Previous version',
        publishedAt: policy.publishedAt || undefined,
        archivedAt: new Date(),
        changedBy: req.user?._id,
      });

      policy.version = newVersion;
      policy.changelog = changelog || `Updated to version ${newVersion}`;
    }

    if (title) policy.title = title.trim();
    if (description) policy.description = description.trim();
    if (content) policy.content = content;
    if (category) policy.category = category;
    if (department !== undefined) policy.department = department || null;
    if (status) policy.status = status;

    policy.updatedBy = req.user!._id;
    await policy.save();

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'UPDATE_POLICY',
      module: 'POLICIES',
      entityId: policy._id.toString(),
      metadata: { title: policy.title, version: policy.version, changelog },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Policy updated successfully.',
      policy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update policy.',
      error: error.message,
    });
  }
};

export const publishPolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      res.status(404).json({ success: false, message: 'Policy not found.' });
      return;
    }

    policy.status = 'Published';
    policy.publishedAt = new Date();
    policy.updatedBy = req.user!._id;
    await policy.save();

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'PUBLISH_POLICY',
      module: 'POLICIES',
      entityId: policy._id.toString(),
      metadata: { title: policy.title, version: policy.version },
      req,
    });

    // Notify users
    const userQuery: any = { isActive: true };
    if (policy.department) {
      userQuery.department = policy.department;
    }

    const targetUsers = await User.find(userQuery).select('_id');
    const notifications = targetUsers.map((u) => ({
      userId: u._id,
      title: 'New Security Policy Published',
      message: `Policy "${policy.title}" (v${policy.version}) has been published and requires your acknowledgement.`,
      type: 'policy',
      link: `/policies/${policy._id}`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      message: `Policy "${policy.title}" published successfully. Notifications sent to ${targetUsers.length} staff member(s).`,
      policy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to publish policy.',
      error: error.message,
    });
  }
};

export const archivePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      res.status(404).json({ success: false, message: 'Policy not found.' });
      return;
    }

    policy.status = 'Archived';
    policy.updatedBy = req.user!._id;
    await policy.save();

    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'ARCHIVE_POLICY',
      module: 'POLICIES',
      entityId: policy._id.toString(),
      metadata: { title: policy.title, version: policy.version },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Policy "${policy.title}" archived.`,
      policy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to archive policy.',
      error: error.message,
    });
  }
};

export const acknowledgePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      res.status(404).json({ success: false, message: 'Policy not found.' });
      return;
    }

    if (policy.status !== 'Published') {
      res.status(400).json({
        success: false,
        message: 'Only published policies can be acknowledged.',
      });
      return;
    }

    const userId = req.user!._id;
    const policyVersion = policy.version;

    // Check if already acknowledged
    const existing = await PolicyAcknowledgement.findOne({
      policyId: policy._id,
      policyVersion,
      userId,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `You have already acknowledged policy "${policy.title}" version ${policyVersion} on ${existing.acknowledgedAt.toLocaleDateString()}.`,
        acknowledgement: existing,
      });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const acknowledgement = await PolicyAcknowledgement.create({
      policyId: policy._id,
      policyVersion,
      userId,
      acknowledgedAt: new Date(),
      ipAddress,
      userAgent,
    });

    await logAudit({
      userId,
      userEmail: req.user?.email || 'SYSTEM',
      userRole: req.user?.role,
      action: 'ACKNOWLEDGE_POLICY',
      module: 'POLICIES',
      entityId: policy._id.toString(),
      metadata: {
        policyTitle: policy.title,
        policyVersion,
        ackId: acknowledgement._id,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Policy "${policy.title}" (v${policyVersion}) acknowledged successfully.`,
      acknowledgement,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to record policy acknowledgement.',
      error: error.message,
    });
  }
};

export const getPolicyAcknowledgements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      res.status(404).json({ success: false, message: 'Policy not found.' });
      return;
    }

    const acks = await PolicyAcknowledgement.find({ policyId: policy._id })
      .populate('userId', 'fullName email employeeId department position site')
      .sort({ acknowledgedAt: -1 });

    const totalStaff = await User.countDocuments({ isActive: true });
    const acknowledgedCount = acks.length;
    const complianceRate = totalStaff > 0 ? Math.round((acknowledgedCount / totalStaff) * 100) : 0;

    res.status(200).json({
      success: true,
      policyTitle: policy.title,
      policyVersion: policy.version,
      acknowledgedCount,
      totalStaff,
      complianceRate,
      acknowledgements: acks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy acknowledgements.',
      error: error.message,
    });
  }
};
