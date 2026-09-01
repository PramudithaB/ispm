"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolicyAcknowledgements = exports.acknowledgePolicy = exports.archivePolicy = exports.publishPolicy = exports.updatePolicy = exports.createPolicy = exports.getPolicyById = exports.getPolicies = void 0;
const db_1 = require("../config/db");
const auditService_1 = require("../services/auditService");
const getPolicies = async (req, res) => {
    try {
        const { category, department, search, status } = req.query;
        const user = req.user;
        const where = {};
        // Staff can ONLY see Published policies
        if (user?.role === 'STAFF') {
            where.status = 'Published';
        }
        else if (status) {
            where.status = status;
        }
        if (category)
            where.category = category;
        if (department)
            where.departmentId = department;
        if (search) {
            const q = String(search);
            where.OR = [
                { title: { contains: q } },
                { description: { contains: q } },
                { content: { contains: q } },
            ];
        }
        const policies = await db_1.prisma.policy.findMany({
            where,
            include: {
                department: true,
                createdBy: { select: { id: true, fullName: true, email: true } },
                updatedBy: { select: { id: true, fullName: true, email: true } },
                versions: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        let enrichedPolicies = policies;
        if (user) {
            const userAcks = await db_1.prisma.policyAcknowledgement.findMany({
                where: { userId: user.id },
            });
            const ackMap = new Set(userAcks.map((ack) => `${ack.policyId}_${ack.policyVersion}`));
            enrichedPolicies = policies.map((p) => {
                const isAcknowledged = ackMap.has(`${p.id}_${p.version}`);
                return {
                    ...p,
                    _id: p.id,
                    department: p.department ? { ...p.department, _id: p.department.id } : null,
                    createdBy: p.createdBy ? { ...p.createdBy, _id: p.createdBy.id } : null,
                    updatedBy: p.updatedBy ? { ...p.updatedBy, _id: p.updatedBy.id } : null,
                    previousVersions: p.versions.map((v) => ({ ...v, _id: v.id })),
                    isAcknowledged,
                };
            });
        }
        else {
            enrichedPolicies = policies.map((p) => ({
                ...p,
                _id: p.id,
                department: p.department ? { ...p.department, _id: p.department.id } : null,
                createdBy: p.createdBy ? { ...p.createdBy, _id: p.createdBy.id } : null,
                updatedBy: p.updatedBy ? { ...p.updatedBy, _id: p.updatedBy.id } : null,
                previousVersions: p.versions.map((v) => ({ ...v, _id: v.id })),
            }));
        }
        res.status(200).json({
            success: true,
            count: enrichedPolicies.length,
            policies: enrichedPolicies,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch policies.',
            error: error.message,
        });
    }
};
exports.getPolicies = getPolicies;
const getPolicyById = async (req, res) => {
    try {
        const policy = await db_1.prisma.policy.findUnique({
            where: { id: req.params.id },
            include: {
                department: true,
                createdBy: { select: { id: true, fullName: true, email: true, position: true } },
                updatedBy: { select: { id: true, fullName: true, email: true, position: true } },
                versions: {
                    orderBy: { createdAt: 'desc' },
                    include: { changedBy: { select: { id: true, fullName: true } } },
                },
            },
        });
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
            const ack = await db_1.prisma.policyAcknowledgement.findFirst({
                where: {
                    policyId: policy.id,
                    policyVersion: policy.version,
                    userId: req.user.id,
                },
            });
            if (ack) {
                isAcknowledged = true;
                acknowledgementDetails = { ...ack, _id: ack.id };
            }
        }
        res.status(200).json({
            success: true,
            policy: {
                ...policy,
                _id: policy.id,
                department: policy.department ? { ...policy.department, _id: policy.department.id } : null,
                createdBy: policy.createdBy ? { ...policy.createdBy, _id: policy.createdBy.id } : null,
                updatedBy: policy.updatedBy ? { ...policy.updatedBy, _id: policy.updatedBy.id } : null,
                previousVersions: policy.versions.map((v) => ({ ...v, _id: v.id })),
                isAcknowledged,
                acknowledgementDetails,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch policy details.',
            error: error.message,
        });
    }
};
exports.getPolicyById = getPolicyById;
const createPolicy = async (req, res) => {
    try {
        const { title, description, content, category, department, effectiveDate, status, version } = req.body;
        if (!title || !description || !content || !category) {
            res.status(400).json({
                success: false,
                message: 'Title, Description, Content, and Category are required.',
            });
            return;
        }
        const policyVersion = version || '1.0';
        const policyStatus = status || 'Draft';
        const policy = await db_1.prisma.policy.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                content,
                category,
                departmentId: department || null,
                effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
                status: policyStatus,
                version: policyVersion,
                publishedAt: policyStatus === 'Published' ? new Date() : null,
                changelog: 'Initial policy creation',
                createdById: req.user.id,
                updatedById: req.user.id,
                versions: {
                    create: {
                        version: policyVersion,
                        title: title.trim(),
                        content,
                        changelog: 'Initial policy version',
                        publishedAt: policyStatus === 'Published' ? new Date() : null,
                        changedById: req.user.id,
                    },
                },
            },
            include: {
                department: true,
                createdBy: { select: { id: true, fullName: true, email: true } },
                versions: true,
            },
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'CREATE_POLICY',
            module: 'POLICIES',
            entityId: policy.id,
            metadata: { title: policy.title, version: policy.version, status: policy.status },
            req,
        });
        res.status(201).json({
            success: true,
            message: 'Policy created successfully.',
            policy: {
                ...policy,
                _id: policy.id,
                previousVersions: policy.versions.map((v) => ({ ...v, _id: v.id })),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create policy.',
            error: error.message,
        });
    }
};
exports.createPolicy = createPolicy;
const updatePolicy = async (req, res) => {
    try {
        const { title, description, content, category, department, changelog, newVersion, status } = req.body;
        const policyId = req.params.id;
        const existingPolicy = await db_1.prisma.policy.findUnique({
            where: { id: policyId },
        });
        if (!existingPolicy) {
            res.status(404).json({ success: false, message: 'Policy not found.' });
            return;
        }
        // Execute multi-step policy versioning inside a MySQL Transaction
        const updatedPolicy = await db_1.prisma.$transaction(async (tx) => {
            // If version changed, archive existing version into policy_versions
            if (newVersion && newVersion !== existingPolicy.version) {
                await tx.policyVersion.upsert({
                    where: {
                        policyId_version: {
                            policyId: existingPolicy.id,
                            version: existingPolicy.version,
                        },
                    },
                    update: {
                        title: existingPolicy.title,
                        content: existingPolicy.content,
                        changelog: existingPolicy.changelog || 'Previous version',
                        archivedAt: new Date(),
                        changedById: req.user.id,
                    },
                    create: {
                        policyId: existingPolicy.id,
                        version: existingPolicy.version,
                        title: existingPolicy.title,
                        content: existingPolicy.content,
                        changelog: existingPolicy.changelog || 'Previous version',
                        publishedAt: existingPolicy.publishedAt,
                        archivedAt: new Date(),
                        changedById: req.user.id,
                    },
                });
            }
            return tx.policy.update({
                where: { id: policyId },
                data: {
                    title: title ? title.trim() : undefined,
                    description: description ? description.trim() : undefined,
                    content: content || undefined,
                    category: category || undefined,
                    departmentId: department !== undefined ? department || null : undefined,
                    status: status || undefined,
                    version: newVersion || undefined,
                    changelog: changelog || (newVersion ? `Updated to version ${newVersion}` : undefined),
                    updatedById: req.user.id,
                },
                include: {
                    department: true,
                    createdBy: { select: { id: true, fullName: true, email: true } },
                    updatedBy: { select: { id: true, fullName: true, email: true } },
                    versions: { orderBy: { createdAt: 'desc' } },
                },
            });
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'UPDATE_POLICY',
            module: 'POLICIES',
            entityId: updatedPolicy.id,
            metadata: { title: updatedPolicy.title, version: updatedPolicy.version, changelog },
            req,
        });
        res.status(200).json({
            success: true,
            message: 'Policy updated successfully.',
            policy: {
                ...updatedPolicy,
                _id: updatedPolicy.id,
                previousVersions: updatedPolicy.versions.map((v) => ({ ...v, _id: v.id })),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update policy.',
            error: error.message,
        });
    }
};
exports.updatePolicy = updatePolicy;
const publishPolicy = async (req, res) => {
    try {
        const policyId = req.params.id;
        // Use MySQL Transaction for publishing policy and generating notifications
        const policy = await db_1.prisma.$transaction(async (tx) => {
            const p = await tx.policy.findUnique({ where: { id: policyId } });
            if (!p)
                throw new Error('Policy not found');
            const now = new Date();
            const updated = await tx.policy.update({
                where: { id: policyId },
                data: {
                    status: 'Published',
                    publishedAt: now,
                    updatedById: req.user.id,
                },
                include: {
                    department: true,
                    versions: true,
                },
            });
            // Upsert policy version for the published version
            await tx.policyVersion.upsert({
                where: {
                    policyId_version: {
                        policyId: updated.id,
                        version: updated.version,
                    },
                },
                update: {
                    publishedAt: now,
                    changedById: req.user.id,
                },
                create: {
                    policyId: updated.id,
                    version: updated.version,
                    title: updated.title,
                    content: updated.content,
                    changelog: updated.changelog || 'Published policy version',
                    publishedAt: now,
                    changedById: req.user.id,
                },
            });
            // Broadcast notifications to all active staff members
            const activeUsers = await tx.user.findMany({
                where: {
                    isActive: true,
                    ...(updated.departmentId ? { departmentId: updated.departmentId } : {}),
                },
                select: { id: true },
            });
            if (activeUsers.length > 0) {
                await tx.notification.createMany({
                    data: activeUsers.map((u) => ({
                        userId: u.id,
                        title: 'New Policy Published',
                        message: `Mandatory security policy "${updated.title}" (v${updated.version}) is now published and requires your acknowledgement.`,
                        type: 'policy',
                        link: `/policies/${updated.id}`,
                    })),
                });
            }
            return updated;
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'PUBLISH_POLICY',
            module: 'POLICIES',
            entityId: policy.id,
            metadata: { title: policy.title, version: policy.version },
            req,
        });
        res.status(200).json({
            success: true,
            message: `Policy "${policy.title}" published successfully. Notifications sent to hospital staff.`,
            policy: {
                ...policy,
                _id: policy.id,
            },
        });
    }
    catch (error) {
        res.status(error.message === 'Policy not found' ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to publish policy.',
        });
    }
};
exports.publishPolicy = publishPolicy;
const archivePolicy = async (req, res) => {
    try {
        const policy = await db_1.prisma.policy.update({
            where: { id: req.params.id },
            data: {
                status: 'Archived',
                updatedById: req.user.id,
            },
        });
        await (0, auditService_1.logAudit)({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'ARCHIVE_POLICY',
            module: 'POLICIES',
            entityId: policy.id,
            metadata: { title: policy.title, version: policy.version },
            req,
        });
        res.status(200).json({
            success: true,
            message: 'Policy archived successfully.',
            policy: { ...policy, _id: policy.id },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to archive policy.',
            error: error.message,
        });
    }
};
exports.archivePolicy = archivePolicy;
const acknowledgePolicy = async (req, res) => {
    try {
        const policyId = req.params.id;
        const userId = req.user.id;
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Unknown Browser';
        const policy = await db_1.prisma.policy.findUnique({
            where: { id: policyId },
        });
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
        // Use transaction for policy acknowledgement & audit
        const acknowledgement = await db_1.prisma.$transaction(async (tx) => {
            // Find matching policy version ID if available
            const policyVer = await tx.policyVersion.findUnique({
                where: {
                    policyId_version: {
                        policyId: policy.id,
                        version: policy.version,
                    },
                },
            });
            return tx.policyAcknowledgement.upsert({
                where: {
                    policyId_policyVersion_userId: {
                        policyId: policy.id,
                        policyVersion: policy.version,
                        userId,
                    },
                },
                update: {
                    acknowledgedAt: new Date(),
                    ipAddress,
                    userAgent,
                },
                create: {
                    policyId: policy.id,
                    policyVersionId: policyVer?.id || null,
                    policyVersion: policy.version,
                    userId,
                    acknowledgedAt: new Date(),
                    ipAddress,
                    userAgent,
                },
            });
        });
        await (0, auditService_1.logAudit)({
            userId,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'ACKNOWLEDGE_POLICY',
            module: 'POLICIES',
            entityId: policy.id,
            metadata: {
                policyTitle: policy.title,
                policyVersion: policy.version,
                ipAddress,
            },
            req,
        });
        res.status(200).json({
            success: true,
            message: `You have successfully acknowledged "${policy.title}" (Version ${policy.version}).`,
            acknowledgement: {
                ...acknowledgement,
                _id: acknowledgement.id,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge policy.',
            error: error.message,
        });
    }
};
exports.acknowledgePolicy = acknowledgePolicy;
const getPolicyAcknowledgements = async (req, res) => {
    try {
        const policyId = req.params.id;
        const acknowledgements = await db_1.prisma.policyAcknowledgement.findMany({
            where: { policyId },
            include: {
                user: {
                    select: {
                        id: true,
                        employeeId: true,
                        fullName: true,
                        email: true,
                        position: true,
                        department: { select: { id: true, name: true, site: true } },
                    },
                },
            },
            orderBy: { acknowledgedAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            count: acknowledgements.length,
            acknowledgements: acknowledgements.map((a) => ({
                ...a,
                _id: a.id,
                user: a.user
                    ? {
                        ...a.user,
                        _id: a.user.id,
                        department: a.user.department
                            ? { ...a.user.department, _id: a.user.department.id }
                            : null,
                    }
                    : null,
            })),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch policy acknowledgements.',
            error: error.message,
        });
    }
};
exports.getPolicyAcknowledgements = getPolicyAcknowledgements;
