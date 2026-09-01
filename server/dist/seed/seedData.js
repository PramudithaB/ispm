"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const seedDatabase = async () => {
    try {
        console.log('🧹 Clearing existing MySQL tables in relational foreign-key order...');
        await db_1.prisma.auditLog.deleteMany({});
        await db_1.prisma.notification.deleteMany({});
        await db_1.prisma.quizAttempt.deleteMany({});
        await db_1.prisma.quizQuestion.deleteMany({});
        await db_1.prisma.quiz.deleteMany({});
        await db_1.prisma.trainingProgress.deleteMany({});
        await db_1.prisma.trainingModule.deleteMany({});
        await db_1.prisma.policyAcknowledgement.deleteMany({});
        await db_1.prisma.policyVersion.deleteMany({});
        await db_1.prisma.policy.deleteMany({});
        await db_1.prisma.incident.deleteMany({});
        await db_1.prisma.user.deleteMany({});
        await db_1.prisma.department.deleteMany({});
        console.log('🏥 1. Seeding Hemas Hospital Departments...');
        const deptER = await db_1.prisma.department.create({
            data: {
                name: 'Emergency & Trauma Care',
                description: '24/7 Acute trauma care, triage, and rapid patient admissions',
                site: 'Hemas Hospital Wattala',
            },
        });
        const deptNursing = await db_1.prisma.department.create({
            data: {
                name: 'Inpatient Nursing Services',
                description: 'General wards, ICU, and surgical nursing care',
                site: 'Hemas Hospital Wattala',
            },
        });
        const deptRadiology = await db_1.prisma.department.create({
            data: {
                name: 'Radiology & Medical Imaging',
                description: 'MRI, CT, Ultrasound, and X-Ray diagnostic services (PACS)',
                site: 'Hemas Hospital Wattala',
            },
        });
        const deptPharmacy = await db_1.prisma.department.create({
            data: {
                name: 'Pharmacy & Pharmaceutical Dispensing',
                description: 'Inpatient and outpatient prescription drug distribution',
                site: 'Hemas Hospital Wattala',
            },
        });
        const deptIT = await db_1.prisma.department.create({
            data: {
                name: 'Information Technology & Cyber Defense',
                description: 'Hospital EMR, network infrastructure, cybersecurity & compliance',
                site: 'Hemas Hospital Wattala',
            },
        });
        const deptAdmin = await db_1.prisma.department.create({
            data: {
                name: 'Hospital Administration & Finance',
                description: 'Executive management, patient billing, human resources, and insurance',
                site: 'Hemas Hospital Wattala',
            },
        });
        console.log('👤 2. Seeding Users with bcrypt-hashed passwords...');
        const passwordHash = await bcryptjs_1.default.hash('Password123!', 10);
        const adminUser = await db_1.prisma.user.create({
            data: {
                employeeId: 'HEM-ADM-001',
                fullName: 'Dr. Chaminda Perera',
                email: 'admin@securehemas.local',
                passwordHash,
                role: 'ADMIN',
                departmentId: deptAdmin.id,
                site: 'Hemas Hospital Wattala',
                position: 'Chief Medical Information Officer & Compliance Lead',
                isActive: true,
            },
        });
        const secUser = await db_1.prisma.user.create({
            data: {
                employeeId: 'HEM-SEC-001',
                fullName: 'Kasun Jayawardena',
                email: 'security@securehemas.local',
                passwordHash,
                role: 'IT_SECURITY_ADMIN',
                departmentId: deptIT.id,
                site: 'Hemas Hospital Wattala',
                position: 'Lead Cybersecurity & Information Protection Officer',
                isActive: true,
            },
        });
        const headUser = await db_1.prisma.user.create({
            data: {
                employeeId: 'HEM-HOD-001',
                fullName: 'Dr. Ruwani Fernando',
                email: 'head@securehemas.local',
                passwordHash,
                role: 'DEPARTMENT_HEAD',
                departmentId: deptER.id,
                site: 'Hemas Hospital Wattala',
                position: 'Head of Emergency & Trauma Services',
                isActive: true,
            },
        });
        const staffUser = await db_1.prisma.user.create({
            data: {
                employeeId: 'HEM-STF-001',
                fullName: 'Sanduni Wickramasinghe',
                email: 'staff@securehemas.local',
                passwordHash,
                role: 'STAFF',
                departmentId: deptNursing.id,
                site: 'Hemas Hospital Wattala',
                position: 'Senior Nursing Officer',
                isActive: true,
            },
        });
        const staffKamal = await db_1.prisma.user.create({
            data: {
                employeeId: 'HEM-STF-002',
                fullName: 'Kamal Alwis',
                email: 'nurse.kamal@securehemas.local',
                passwordHash,
                role: 'STAFF',
                departmentId: deptER.id,
                site: 'Hemas Hospital Wattala',
                position: 'Emergency Triage Nurse',
                isActive: true,
            },
        });
        const staffAnusha = await db_1.prisma.user.create({
            data: {
                employeeId: 'HEM-STF-003',
                fullName: 'Anusha Senanayake',
                email: 'radiologist.anusha@securehemas.local',
                passwordHash,
                role: 'STAFF',
                departmentId: deptRadiology.id,
                site: 'Hemas Hospital Wattala',
                position: 'Senior Radiographer & PACS Operator',
                isActive: true,
            },
        });
        const staffDilshan = await db_1.prisma.user.create({
            data: {
                employeeId: 'HEM-STF-004',
                fullName: 'Dilshan Silva',
                email: 'pharmacist.dilshan@securehemas.local',
                passwordHash,
                role: 'STAFF',
                departmentId: deptPharmacy.id,
                site: 'Hemas Hospital Wattala',
                position: 'Senior Clinical Pharmacist',
                isActive: true,
            },
        });
        const staffPriyanka = await db_1.prisma.user.create({
            data: {
                employeeId: 'HEM-STF-005',
                fullName: 'Priyanka De Mel',
                email: 'billing.priyanka@securehemas.local',
                passwordHash,
                role: 'STAFF',
                departmentId: deptAdmin.id,
                site: 'Hemas Hospital Wattala',
                position: 'Billing & Patient Insurance Executive',
                isActive: true,
            },
        });
        console.log('📜 3. Seeding Policies and Policy Versions...');
        const policyPHI = await db_1.prisma.policy.create({
            data: {
                title: 'Patient Health Information (PHI) Confidentiality & Data Privacy Policy',
                description: 'Mandatory protocols for safeguarding electronic medical records (EMR), patient diagnoses, and medical data confidentiality.',
                content: `### 1. Objective & Scope
This policy defines mandatory requirements for protecting Patient Health Information (PHI) and Electronic Medical Records (EMR) across all Hemas Hospital facilities.

### 2. Core Principles
* **Minimum Necessary Standard**: Staff may access only the specific patient health records necessary to fulfill their immediate clinical duty.
* **Prohibition of Unauthorized Sharing**: Patient medical histories, diagnostic imagery, or lab reports must never be transmitted via unencrypted personal messaging apps.
* **Screens & Visual Privacy**: Clinical workstation screens displaying patient records must never face public waiting areas or corridors.`,
                category: 'Data Privacy & Confidentiality',
                version: '2.0',
                status: 'Published',
                effectiveDate: new Date('2026-01-01'),
                publishedAt: new Date('2026-01-01'),
                changelog: 'Updated section 2 to explicitly forbid personal messaging apps for medical records.',
                createdById: secUser.id,
                updatedById: secUser.id,
                versions: {
                    create: [
                        {
                            version: '1.0',
                            title: 'Patient Health Information (PHI) Confidentiality Policy',
                            content: 'Initial baseline release of PHI confidentiality guidelines.',
                            changelog: 'Initial baseline release.',
                            publishedAt: new Date('2025-06-01'),
                            archivedAt: new Date('2026-01-01'),
                            changedById: secUser.id,
                        },
                        {
                            version: '2.0',
                            title: 'Patient Health Information (PHI) Confidentiality & Data Privacy Policy',
                            content: 'Updated version 2.0 with enhanced messaging protocols.',
                            changelog: 'Updated section 2 for messaging apps.',
                            publishedAt: new Date('2026-01-01'),
                            changedById: secUser.id,
                        },
                    ],
                },
            },
        });
        const policyPassword = await db_1.prisma.policy.create({
            data: {
                title: 'Clinical Workstation Password Hygiene & Access Control Policy',
                description: 'Standards for password complexity, multi-factor authentication (MFA), and mandatory screen-locking in patient care areas.',
                content: `### 1. Password Requirements
* Minimum length of **12 characters**.
* Must contain uppercase, lowercase, numbers, and special symbols.

### 2. Inactivity Screen Timeout
* Screen timeout enforced at **3 minutes** in all patient-facing terminals.`,
                category: 'Access Control & Passwords',
                version: '1.2',
                status: 'Published',
                effectiveDate: new Date('2026-01-15'),
                publishedAt: new Date('2026-01-15'),
                changelog: 'Decreased inactivity screen timeout from 5 minutes to 3 minutes for clinical wards.',
                createdById: secUser.id,
                updatedById: secUser.id,
                versions: {
                    create: [
                        {
                            version: '1.2',
                            title: 'Clinical Workstation Password Hygiene & Access Control Policy',
                            content: 'Active v1.2 specifications.',
                            changelog: 'Inactivity screen timeout adjustment.',
                            publishedAt: new Date('2026-01-15'),
                            changedById: secUser.id,
                        },
                    ],
                },
            },
        });
        const policyDevice = await db_1.prisma.policy.create({
            data: {
                title: 'Biomedical Devices & Endpoint IoT Cybersecurity Standard',
                description: 'Security requirements for networked medical equipment including infusion pumps, MRI/CT scanners, and mobile diagnostic tablets.',
                content: `### 1. Scope
Applies to connected medical devices, diagnostic PACS imaging, and tablets.

### 2. Mandatory Controls
* Dedicated isolated VLANs with zero direct public Internet routing.
* Unauthorized USB sticks or personal phones strictly prohibited.`,
                category: 'Device & Endpoint Security',
                version: '1.0',
                status: 'Published',
                effectiveDate: new Date('2026-02-01'),
                publishedAt: new Date('2026-02-01'),
                changelog: 'Initial baseline release.',
                createdById: secUser.id,
                updatedById: secUser.id,
                versions: {
                    create: [
                        {
                            version: '1.0',
                            title: 'Biomedical Devices & Endpoint IoT Cybersecurity Standard',
                            content: 'Baseline release.',
                            changelog: 'Initial release.',
                            publishedAt: new Date('2026-02-01'),
                            changedById: secUser.id,
                        },
                    ],
                },
            },
        });
        const policyIncident = await db_1.prisma.policy.create({
            data: {
                title: 'Hospital Cybersecurity Incident & Ransomware Response Protocol',
                description: 'Step-by-step procedures for reporting, isolating, and mitigating suspected cyberattacks, ransomware, or lost credentials.',
                content: `### 1. Immediate Actions
1. Disconnect Ethernet network cable or turn off Wi-Fi immediately.
2. Notify IT Security hotline Ext. 4444 or submit report on SecureHemas.`,
                category: 'Incident Response',
                version: '1.1',
                status: 'Published',
                effectiveDate: new Date('2026-02-10'),
                publishedAt: new Date('2026-02-10'),
                changelog: 'Added dedicated isolation instructions for ransomware outbreaks.',
                createdById: secUser.id,
                updatedById: secUser.id,
                versions: {
                    create: [
                        {
                            version: '1.1',
                            title: 'Hospital Cybersecurity Incident & Ransomware Response Protocol',
                            content: 'Active v1.1 protocol.',
                            changelog: 'Ransomware isolation additions.',
                            publishedAt: new Date('2026-02-10'),
                            changedById: secUser.id,
                        },
                    ],
                },
            },
        });
        const policyPhysical = await db_1.prisma.policy.create({
            data: {
                title: 'Physical Security & Clean Desk Standard for Clinical Stations',
                description: 'Requirements for visitor badging, secure document shredding, and physical access controls.',
                content: `### 1. Clean Desk Policy
Physical records and medication charts must be locked inside filing cabinets when unattended.`,
                category: 'Physical & Environmental Security',
                version: '1.0',
                status: 'Published',
                effectiveDate: new Date('2026-02-15'),
                publishedAt: new Date('2026-02-15'),
                changelog: 'Initial baseline release.',
                createdById: secUser.id,
                updatedById: secUser.id,
                versions: {
                    create: [
                        {
                            version: '1.0',
                            title: 'Physical Security & Clean Desk Standard for Clinical Stations',
                            content: 'Active v1.0 specifications.',
                            changelog: 'Initial release.',
                            publishedAt: new Date('2026-02-15'),
                            changedById: secUser.id,
                        },
                    ],
                },
            },
        });
        const policyDraft = await db_1.prisma.policy.create({
            data: {
                title: 'Acceptable Use of Hospital Telemedicine Platforms & AI Tools',
                description: 'Draft guidelines governing the use of cloud-based telemedicine tools and generative AI in diagnostic workflows.',
                content: `### Draft Policy Under IT Security Review
Strictly prohibits inputting identifiable patient records into external generative AI systems.`,
                category: 'Acceptable Use Policy',
                version: '0.9',
                status: 'Draft',
                effectiveDate: new Date('2026-03-01'),
                changelog: 'Initial draft for review by Medical Board and IT Security.',
                createdById: secUser.id,
                updatedById: secUser.id,
            },
        });
        console.log('✍️ 4. Seeding Policy Acknowledgements...');
        await db_1.prisma.policyAcknowledgement.create({
            data: {
                policyId: policyPHI.id,
                policyVersion: '2.0',
                userId: staffUser.id,
                ipAddress: '192.168.10.45',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            },
        });
        await db_1.prisma.policyAcknowledgement.create({
            data: {
                policyId: policyPassword.id,
                policyVersion: '1.2',
                userId: staffUser.id,
                ipAddress: '192.168.10.45',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            },
        });
        await db_1.prisma.policyAcknowledgement.create({
            data: {
                policyId: policyPHI.id,
                policyVersion: '2.0',
                userId: staffKamal.id,
                ipAddress: '192.168.10.50',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
        });
        await db_1.prisma.policyAcknowledgement.create({
            data: {
                policyId: policyDevice.id,
                policyVersion: '1.0',
                userId: staffAnusha.id,
                ipAddress: '192.168.20.12',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
        });
        await db_1.prisma.policyAcknowledgement.create({
            data: {
                policyId: policyPHI.id,
                policyVersion: '2.0',
                userId: headUser.id,
                ipAddress: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            },
        });
        console.log('🎓 5. Seeding Training Modules, Quizzes, and Questions...');
        const now = new Date();
        const futureDueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        // Module 1: Patient Data Confidentiality
        const mod1 = await db_1.prisma.trainingModule.create({
            data: {
                title: 'Patient Data Confidentiality & EMR Access Controls',
                description: 'Essential healthcare cybersecurity training on safeguarding electronic medical records, avoiding privacy leaks, and adhering to HIPAA/clinical data privacy standards.',
                category: 'Patient Data Confidentiality',
                durationMinutes: 15,
                passingScore: 80,
                version: '1.0',
                status: 'Published',
                dueDate: futureDueDate,
                createdById: secUser.id,
                content: {
                    introduction: 'In a high-intensity hospital environment, patient trust depends heavily on data confidentiality. This module teaches you how to recognize data privacy risks and protect patient records.',
                    sections: [
                        {
                            title: '1. The "Need-to-Know" Rule in Clinical Practice',
                            body: 'Hospital staff may only inspect medical charts of patients actively assigned under their care.',
                            icon: 'shield-check',
                            highlights: [
                                'Never search for patients outside your assigned ward',
                                'Audit logs track every single chart lookup',
                                'Viewing records of colleagues without justification is prohibited',
                            ],
                        },
                        {
                            title: '2. Digital Communication and Patient Data',
                            body: 'Consumer messaging apps (WhatsApp, Telegram) must never be used for identifiable patient records.',
                            icon: 'message-square-off',
                            highlights: [
                                'No patient diagnostic photos on personal phones',
                                'Use only hospital-sanctioned secure internal portals',
                            ],
                        },
                    ],
                    examples: [
                        {
                            scenario: 'A prominent local VIP is admitted to your ward. A colleague asks if you can check their lab results.',
                            correctAction: 'Refuse immediately and remind them that EMR audits actively flag lookups outside care assignments.',
                            riskLevel: 'Critical',
                            clinicalImpact: 'Severe regulatory fine, loss of hospital accreditation, and termination of employment.',
                        },
                    ],
                    keyTakeaways: [
                        'Only access records for patients under your direct care',
                        'Never share diagnostic images via personal chat apps',
                        'Always lock unattended workstations',
                    ],
                },
                assignedRoles: ['STAFF', 'DEPARTMENT_HEAD', 'ADMIN', 'IT_SECURITY_ADMIN'],
            },
        });
        const quiz1 = await db_1.prisma.quiz.create({
            data: {
                trainingModuleId: mod1.id,
                passingScore: 80,
            },
        });
        await db_1.prisma.quizQuestion.create({
            data: {
                quizId: quiz1.id,
                questionId: 'q1',
                question: 'Under what circumstances may a nurse or clinician access a patient’s electronic medical record (EMR)?',
                options: [
                    'Whenever the patient is a family member or personal acquaintance',
                    'Only when assigned directly to provide active clinical care to that patient',
                    'Whenever requested by an external insurance agent over the phone',
                    'Anytime during an active working shift for curiosity or learning',
                ],
                correctAnswer: 1,
                explanation: 'The "Need-to-Know" principle dictates that access is permitted solely when necessary for active direct patient care.',
                orderIndex: 0,
            },
        });
        await db_1.prisma.quizQuestion.create({
            data: {
                quizId: quiz1.id,
                questionId: 'q2',
                question: 'A doctor needs a second opinion on a rash and wants to take a photo on a personal smartphone. Is this allowed?',
                options: [
                    'Yes, provided the photo does not include the patient’s face',
                    'Yes, as long as it is sent via end-to-end encrypted personal WhatsApp',
                    'No. Patient imagery must only be captured and stored on hospital-approved, encrypted clinical devices',
                    'Yes, if the patient gives verbal permission',
                ],
                correctAnswer: 2,
                explanation: 'Capturing identifiable patient conditions on personal devices violates clinical data confidentiality standards.',
                orderIndex: 1,
            },
        });
        await db_1.prisma.quizQuestion.create({
            data: {
                quizId: quiz1.id,
                questionId: 'q3',
                question: 'What is the required inactivity screen timeout for clinical workstations in Hemas Hospital wards?',
                options: ['15 minutes', '10 minutes', '3 minutes', '1 hour'],
                correctAnswer: 2,
                explanation: 'Clinical workstations enforce an automatic 3-minute screen lock to prevent unauthorized visual inspection.',
                orderIndex: 2,
            },
        });
        // Module 2: Phishing Awareness
        const mod2 = await db_1.prisma.trainingModule.create({
            data: {
                title: 'Phishing Defense & Social Engineering in Healthcare',
                description: 'Learn to identify targeted spear-phishing emails, urgent impersonation scams, and malicious attachments targeting hospital personnel.',
                category: 'Phishing Awareness',
                durationMinutes: 12,
                passingScore: 80,
                version: '1.0',
                status: 'Published',
                dueDate: futureDueDate,
                createdById: secUser.id,
                content: {
                    introduction: 'Healthcare institutions are prime targets for ransomware gangs and phishing syndicates seeking medical records.',
                    sections: [
                        {
                            title: '1. Anatomy of a Healthcare Phishing Email',
                            body: 'Attackers create urgent scenarios claiming urgent payroll updates, medical board credential renewals, or urgent lab equipment firmware patches.',
                            icon: 'mail-warning',
                            highlights: [
                                'Inspect sender email domain carefully',
                                'Beware of artificial urgency and panic inducement',
                                'Hover over hyperlinks to verify real destination URL',
                            ],
                        },
                    ],
                    examples: [
                        {
                            scenario: 'You receive an email claiming to be from "Hemas IT Support" asking you to click a link to verify your password immediately.',
                            correctAction: 'Do not click the link. Report it immediately using the SecureHemas incident reporting system.',
                            riskLevel: 'High',
                            clinicalImpact: 'Potential ransomware infection locking hospital EMR and diagnostic systems.',
                        },
                    ],
                    keyTakeaways: [
                        'Never enter credentials on external non-hemas pages',
                        'Verify unexpected attachments before opening',
                    ],
                },
                assignedRoles: ['STAFF', 'DEPARTMENT_HEAD', 'ADMIN', 'IT_SECURITY_ADMIN'],
            },
        });
        const quiz2 = await db_1.prisma.quiz.create({
            data: {
                trainingModuleId: mod2.id,
                passingScore: 80,
            },
        });
        await db_1.prisma.quizQuestion.create({
            data: {
                quizId: quiz2.id,
                questionId: 'q1',
                question: 'An email arrives with subject "URGENT: Hemas Payroll Discrepancy - Verify Now" with a login link. What should you do?',
                options: [
                    'Click the link and quickly log in to check your pay slip',
                    'Forward the email to all colleagues in your department to warn them',
                    'Do NOT click any link; report the email as a Suspicious Incident to IT Cyber Defense',
                    'Reply to the email asking if it is authentic',
                ],
                correctAnswer: 2,
                explanation: 'Never click links in unexpected urgent emails. Report immediately to IT Cyber Defense.',
                orderIndex: 0,
            },
        });
        await db_1.prisma.quizQuestion.create({
            data: {
                quizId: quiz2.id,
                questionId: 'q2',
                question: 'What is a common sign of a phishing attack?',
                options: [
                    'Mismatched sender domain and artificial urgency',
                    'An email sent from an official hospital internal address with expected reports',
                    'A calendar invite from your department head for a scheduled staff meeting',
                    'A password expiration notice delivered inside the internal intranet portal',
                ],
                correctAnswer: 0,
                explanation: 'Phishing emails frequently employ spoofed sender domains and artificial urgency to trigger hurried actions.',
                orderIndex: 1,
            },
        });
        console.log('📈 6. Seeding Training Progress & Quiz Attempts...');
        // staffUser completed Module 1
        await db_1.prisma.trainingProgress.create({
            data: {
                userId: staffUser.id,
                trainingModuleId: mod1.id,
                status: 'Completed',
                score: 100,
                attempts: 1,
                startedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                dueDate: futureDueDate,
            },
        });
        await db_1.prisma.quizAttempt.create({
            data: {
                quizId: quiz1.id,
                userId: staffUser.id,
                attemptNumber: 1,
                score: 100,
                passed: true,
                answers: [
                    { questionId: 'q1', selectedOption: 1, isCorrect: true },
                    { questionId: 'q2', selectedOption: 2, isCorrect: true },
                    { questionId: 'q3', selectedOption: 2, isCorrect: true },
                ],
                submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            },
        });
        // staffKamal in progress on Module 1
        await db_1.prisma.trainingProgress.create({
            data: {
                userId: staffKamal.id,
                trainingModuleId: mod1.id,
                status: 'In Progress',
                score: 66,
                attempts: 1,
                startedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                dueDate: futureDueDate,
            },
        });
        await db_1.prisma.quizAttempt.create({
            data: {
                quizId: quiz1.id,
                userId: staffKamal.id,
                attemptNumber: 1,
                score: 66,
                passed: false,
                answers: [
                    { questionId: 'q1', selectedOption: 1, isCorrect: true },
                    { questionId: 'q2', selectedOption: 1, isCorrect: false },
                    { questionId: 'q3', selectedOption: 2, isCorrect: true },
                ],
                submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            },
        });
        // staffAnusha completed Module 2
        await db_1.prisma.trainingProgress.create({
            data: {
                userId: staffAnusha.id,
                trainingModuleId: mod2.id,
                status: 'Completed',
                score: 100,
                attempts: 1,
                startedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                dueDate: futureDueDate,
            },
        });
        console.log('🚨 7. Seeding Incidents...');
        await db_1.prisma.incident.create({
            data: {
                incidentNumber: 'INC-2026-0001',
                reportedById: staffUser.id,
                incidentType: 'Suspicious Email',
                title: 'Phishing Email claiming to be Hemas HR Executive Bonus Portal',
                description: 'Received an email from external domain @hemas-hospital-hr.com requesting login with my clinical Active Directory credentials to confirm annual bonus payments.',
                priority: 'High',
                status: 'In Review',
                departmentId: deptNursing.id,
                assignedToId: secUser.id,
                notes: [
                    {
                        authorId: secUser.id,
                        authorName: secUser.fullName,
                        authorRole: secUser.role,
                        note: 'Analyzed sender headers; domain is hosted in Frankfurt. Blacklisted on perimeter email gateway.',
                        createdAt: new Date().toISOString(),
                    },
                ],
            },
        });
        await db_1.prisma.incident.create({
            data: {
                incidentNumber: 'INC-2026-0002',
                reportedById: staffKamal.id,
                incidentType: 'Unauthorized Access',
                title: 'Unlocked Nurse Station Terminal left open in ER Waiting Area',
                description: 'Station 4 in ER triage was left unlocked and logged in for over 10 minutes while patients were in the queue.',
                priority: 'Medium',
                status: 'Open',
                departmentId: deptER.id,
                notes: [],
            },
        });
        await db_1.prisma.incident.create({
            data: {
                incidentNumber: 'INC-2026-0003',
                reportedById: staffAnusha.id,
                incidentType: 'Lost Device',
                title: 'Department Tablet (Radiology PACS Bedside Unit 3) Misplaced',
                description: 'Bedside ultrasound tablet was not returned to charging dock after morning ward rounds.',
                priority: 'Critical',
                status: 'Resolved',
                departmentId: deptRadiology.id,
                assignedToId: secUser.id,
                resolutionNotes: 'Tablet was located inside Ultrasound Room B. Remote wipe cancelled. MDM PIN reset and re-docked securely.',
                resolvedAt: new Date(),
                notes: [
                    {
                        authorId: secUser.id,
                        authorName: secUser.fullName,
                        authorRole: secUser.role,
                        note: 'Device located. Physical security verification complete.',
                        createdAt: new Date().toISOString(),
                    },
                ],
            },
        });
        console.log('🔔 8. Seeding Notifications...');
        await db_1.prisma.notification.create({
            data: {
                userId: staffUser.id,
                title: 'New Policy Published',
                message: 'Please review and acknowledge the updated "Patient Health Information (PHI) Confidentiality Policy" (v2.0).',
                type: 'policy',
                link: `/policies/${policyPHI.id}`,
                isRead: true,
            },
        });
        await db_1.prisma.notification.create({
            data: {
                userId: staffUser.id,
                title: 'Training Module Assigned',
                message: 'You have been enrolled in "Phishing Defense & Social Engineering in Healthcare".',
                type: 'training',
                link: `/training/${mod2.id}`,
                isRead: false,
            },
        });
        await db_1.prisma.notification.create({
            data: {
                userId: secUser.id,
                title: 'New High Priority Incident Reported',
                message: 'Sanduni Wickramasinghe reported a suspicious phishing email campaign targeting clinical staff.',
                type: 'incident',
                link: '/incidents',
                isRead: false,
            },
        });
        console.log('📝 9. Seeding Audit Logs...');
        await db_1.prisma.auditLog.create({
            data: {
                userId: adminUser.id,
                userEmail: adminUser.email,
                userRole: adminUser.role,
                action: 'LOGIN',
                module: 'AUTH',
                ipAddress: '192.168.1.10',
                metadata: { system: 'SecureHemas Initialization' },
            },
        });
        await db_1.prisma.auditLog.create({
            data: {
                userId: secUser.id,
                userEmail: secUser.email,
                userRole: secUser.role,
                action: 'PUBLISH_POLICY',
                module: 'POLICIES',
                entityId: policyPHI.id,
                ipAddress: '192.168.1.15',
                metadata: { policyTitle: policyPHI.title, version: '2.0' },
            },
        });
        await db_1.prisma.auditLog.create({
            data: {
                userId: staffUser.id,
                userEmail: staffUser.email,
                userRole: staffUser.role,
                action: 'ACKNOWLEDGE_POLICY',
                module: 'POLICIES',
                entityId: policyPHI.id,
                ipAddress: '192.168.10.45',
                metadata: { policyTitle: policyPHI.title, version: '2.0' },
            },
        });
        await db_1.prisma.auditLog.create({
            data: {
                userId: staffUser.id,
                userEmail: staffUser.email,
                userRole: staffUser.role,
                action: 'COMPLETE_TRAINING',
                module: 'TRAINING',
                entityId: mod1.id,
                ipAddress: '192.168.10.45',
                metadata: { trainingTitle: mod1.title, finalScore: 100 },
            },
        });
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║             SECUREHEMAS MYSQL SEED COMPLETED                   ║
╠════════════════════════════════════════════════════════════════╣
║  • Departments:         6 created                              ║
║  • Users:               8 created (Admin, Sec, Head, Staff)    ║
║  • Policies:            6 created                              ║
║  • Policy Versions:     5 snapshots created                    ║
║  • Acknowledgements:    5 records created                      ║
║  • Training Modules:    2 created with Quizzes & Questions     ║
║  • Training Progress:   3 staff records                        ║
║  • Incidents:           3 reported & triaged                   ║
║  • Notifications:       3 active user notifications            ║
║  • Audit Logs:          4 immutable security trail entries     ║
║                                                                ║
║  All demo passwords:    Password123!                           ║
║  Admin login:           admin@securehemas.local                ║
║  IT Security login:     security@securehemas.local             ║
║  Department Head login: head@securehemas.local                 ║
║  Staff login:           staff@securehemas.local                ║
╚════════════════════════════════════════════════════════════════╝
    `);
    }
    catch (error) {
        console.error('❌ Failed to seed MySQL database:', error);
        throw error;
    }
};
exports.seedDatabase = seedDatabase;
// If run directly via ts-node
if (require.main === module) {
    (async () => {
        await (0, db_1.connectDB)();
        await (0, exports.seedDatabase)();
        await (0, db_1.disconnectDB)();
    })();
}
