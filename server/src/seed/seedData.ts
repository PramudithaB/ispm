import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { Policy } from '../models/Policy';
import { PolicyAcknowledgement } from '../models/PolicyAcknowledgement';
import { TrainingModule } from '../models/TrainingModule';
import { Quiz } from '../models/Quiz';
import { TrainingProgress } from '../models/TrainingProgress';
import { Incident } from '../models/Incident';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { connectDB } from '../config/db';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      Department.deleteMany({}),
      User.deleteMany({}),
      Policy.deleteMany({}),
      PolicyAcknowledgement.deleteMany({}),
      TrainingModule.deleteMany({}),
      Quiz.deleteMany({}),
      TrainingProgress.deleteMany({}),
      Incident.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('🏥 Creating Hemas Hospital Departments...');
    const [deptER, deptNursing, deptRadiology, deptPharmacy, deptIT, deptAdmin] =
      await Department.insertMany([
        {
          name: 'Emergency & Trauma Care',
          description: '24/7 Acute trauma care, triage, and rapid patient admissions',
          site: 'Hemas Hospital Wattala',
        },
        {
          name: 'Inpatient Nursing Services',
          description: 'General wards, ICU, and surgical nursing care',
          site: 'Hemas Hospital Wattala',
        },
        {
          name: 'Radiology & Medical Imaging',
          description: 'MRI, CT, Ultrasound, and X-Ray diagnostic services (PACS)',
          site: 'Hemas Hospital Wattala',
        },
        {
          name: 'Pharmacy & Pharmaceutical Dispensing',
          description: 'Inpatient and outpatient prescription drug distribution',
          site: 'Hemas Hospital Wattala',
        },
        {
          name: 'Information Technology & Cyber Defense',
          description: 'Hospital EMR, network infrastructure, cybersecurity & compliance',
          site: 'Hemas Hospital Wattala',
        },
        {
          name: 'Hospital Administration & Finance',
          description: 'Executive management, patient billing, human resources, and insurance',
          site: 'Hemas Hospital Wattala',
        },
      ]);

    console.log('👤 Creating Demo Users with encrypted passwords...');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const [adminUser, secUser, headUser, staffUser, staffKamal, staffAnusha, staffDilshan, staffPriyanka] =
      await User.insertMany([
        {
          employeeId: 'HEM-ADM-001',
          fullName: 'Dr. Chaminda Perera',
          email: 'admin@securehemas.local',
          passwordHash,
          role: 'ADMIN',
          department: deptAdmin._id,
          site: 'Hemas Hospital Wattala',
          position: 'Chief Medical Information Officer & Compliance Lead',
          isActive: true,
        },
        {
          employeeId: 'HEM-SEC-001',
          fullName: 'Kasun Jayawardena',
          email: 'security@securehemas.local',
          passwordHash,
          role: 'IT_SECURITY_ADMIN',
          department: deptIT._id,
          site: 'Hemas Hospital Wattala',
          position: 'Lead Cybersecurity & Information Protection Officer',
          isActive: true,
        },
        {
          employeeId: 'HEM-HOD-001',
          fullName: 'Dr. Ruwani Fernando',
          email: 'head@securehemas.local',
          passwordHash,
          role: 'DEPARTMENT_HEAD',
          department: deptER._id,
          site: 'Hemas Hospital Wattala',
          position: 'Head of Emergency & Trauma Services',
          isActive: true,
        },
        {
          employeeId: 'HEM-STF-001',
          fullName: 'Sanduni Wickramasinghe',
          email: 'staff@securehemas.local',
          passwordHash,
          role: 'STAFF',
          department: deptNursing._id,
          site: 'Hemas Hospital Wattala',
          position: 'Senior Nursing Officer',
          isActive: true,
        },
        {
          employeeId: 'HEM-STF-002',
          fullName: 'Kamal Alwis',
          email: 'nurse.kamal@securehemas.local',
          passwordHash,
          role: 'STAFF',
          department: deptER._id,
          site: 'Hemas Hospital Wattala',
          position: 'Emergency Triage Nurse',
          isActive: true,
        },
        {
          employeeId: 'HEM-STF-003',
          fullName: 'Anusha Senanayake',
          email: 'radiologist.anusha@securehemas.local',
          passwordHash,
          role: 'STAFF',
          department: deptRadiology._id,
          site: 'Hemas Hospital Wattala',
          position: 'Senior Radiographer & PACS Operator',
          isActive: true,
        },
        {
          employeeId: 'HEM-STF-004',
          fullName: 'Dilshan Silva',
          email: 'pharmacist.dilshan@securehemas.local',
          passwordHash,
          role: 'STAFF',
          department: deptPharmacy._id,
          site: 'Hemas Hospital Wattala',
          position: 'Senior Clinical Pharmacist',
          isActive: true,
        },
        {
          employeeId: 'HEM-STF-005',
          fullName: 'Priyanka De Mel',
          email: 'billing.priyanka@securehemas.local',
          passwordHash,
          role: 'STAFF',
          department: deptAdmin._id,
          site: 'Hemas Hospital Wattala',
          position: 'Billing & Patient Insurance Executive',
          isActive: true,
        },
      ]);

    console.log('📜 Creating Information Security Policies...');
    const [policyPHI, policyPassword, policyDevice, policyIncident, policyPhysical, policyDraft] =
      await Policy.insertMany([
        {
          title: 'Patient Health Information (PHI) Confidentiality & Data Privacy Policy',
          description:
            'Mandatory protocols for safeguarding electronic medical records (EMR), patient diagnoses, and medical data confidentiality.',
          content: `### 1. Objective & Scope
This policy defines mandatory requirements for protecting Patient Health Information (PHI) and Electronic Medical Records (EMR) across all Hemas Hospital facilities. It applies to all clinical practitioners, nursing personnel, administrative staff, and third-party contractors.

### 2. Core Principles
* **Minimum Necessary Standard**: Staff may access only the specific patient health records necessary to fulfill their immediate clinical or administrative duty.
* **Prohibition of Unauthorized Sharing**: Patient medical histories, diagnostic imagery, or lab reports must never be transmitted via unencrypted personal messaging apps (e.g. WhatsApp, personal email).
* **Screens & Visual Privacy**: Clinical workstation screens displaying patient records must never face public waiting areas or corridors.

### 3. Data Classification
All patient-identifiable data is classified as **RESTRICTED - HIGH CONFIDENTIALITY**. Unauthorized disclosure represents a severe regulatory violation under national healthcare privacy standards.

### 4. Enforcement & Penalties
Violations of this policy will result in immediate suspension of EMR access credentials and formal disciplinary proceedings.`,
          category: 'Data Privacy & Confidentiality',
          version: '2.0',
          status: 'Published',
          effectiveDate: new Date('2026-01-01'),
          publishedAt: new Date('2026-01-01'),
          changelog: 'Updated section 2 to explicitly forbid personal messaging apps for medical records.',
          previousVersions: [
            {
              version: '1.0',
              title: 'Patient Health Information (PHI) Confidentiality Policy',
              content: 'Initial version of PHI confidentiality guidelines.',
              changelog: 'Initial baseline release.',
              publishedAt: new Date('2025-06-01'),
              archivedAt: new Date('2026-01-01'),
              changedBy: secUser._id,
            },
          ],
          createdBy: secUser._id,
          updatedBy: secUser._id,
        },
        {
          title: 'Clinical Workstation Password Hygiene & Access Control Policy',
          description:
            'Standards for password complexity, multi-factor authentication (MFA), and mandatory screen-locking in patient care areas.',
          content: `### 1. Password Requirements
* Minimum length of **12 characters**.
* Must contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special symbol (\`!@#$%^&*\`).
* Prohibited: Common dictionary words, hospital room names, or sequential numbers (e.g., \`Hemas2026!\` is prohibited).

### 2. Automatic Screen Locking & Clean Workstation
* Workstations in clinical, nursing, and pharmacy areas must be manually locked (\`Windows + L\` / \`Control + Command + Q\`) whenever left unattended.
* Inactivity screen timeout is enforced automatically at **3 minutes** in all patient-facing terminals.

### 3. Credential Sharing Prohibition
Under no circumstances should any staff member share their login credentials or smartcard, even during medical emergencies. Delegated role-based emergency accounts must be utilized instead.`,
          category: 'Access Control & Passwords',
          version: '1.2',
          status: 'Published',
          effectiveDate: new Date('2026-01-15'),
          publishedAt: new Date('2026-01-15'),
          changelog: 'Decreased inactivity screen timeout from 5 minutes to 3 minutes for clinical wards.',
          createdBy: secUser._id,
          updatedBy: secUser._id,
        },
        {
          title: 'Biomedical Devices & Endpoint IoT Cybersecurity Standard',
          description:
            'Security requirements for networked medical equipment including infusion pumps, MRI/CT scanners, and mobile diagnostic tablets.',
          content: `### 1. Scope
Applies to all connected medical devices, diagnostic imaging systems (PACS), and mobile tablets used for bedside patient care.

### 2. Mandatory Controls
* **Network Segmentation**: All biomedical devices must operate strictly within dedicated, isolated VLANs with zero direct public Internet routing.
* **USB & Removable Media**: Plugging unauthorized USB flash drives or personal smartphones into diagnostic equipment or medical workstations is strictly prohibited.
* **Patch Management**: Security patches must be validated by Biomedical Engineering and IT Security prior to hospital-wide deployment.`,
          category: 'Device & Endpoint Security',
          version: '1.0',
          status: 'Published',
          effectiveDate: new Date('2026-02-01'),
          publishedAt: new Date('2026-02-01'),
          changelog: 'Initial baseline release.',
          createdBy: secUser._id,
          updatedBy: secUser._id,
        },
        {
          title: 'Hospital Cybersecurity Incident & Ransomware Response Protocol',
          description:
            'Step-by-step procedures for reporting, isolating, and mitigating suspected cyberattacks, ransomware, or lost credentials.',
          content: `### 1. Immediate Actions upon Suspected Breach or Ransomware
1. **Do NOT power off the computer**; disconnect the Ethernet network cable or turn off Wi-Fi immediately.
2. Immediately notify IT Security hotline at **Ext. 4444** or submit a Critical Incident report via SecureHemas.
3. Note any on-screen error messages, unusual pop-ups, or ransom notes.

### 2. Incident Classification & Triage
Incidents are triaged within 15 minutes of submission by the IT Security Response Team according to severity levels: Critical, High, Medium, and Low.`,
          category: 'Incident Response',
          version: '1.1',
          status: 'Published',
          effectiveDate: new Date('2026-02-10'),
          publishedAt: new Date('2026-02-10'),
          changelog: 'Added dedicated isolation instructions for ransomware outbreaks.',
          createdBy: secUser._id,
          updatedBy: secUser._id,
        },
        {
          title: 'Physical Security & Clean Desk Standard for Clinical Stations',
          description:
            'Requirements for visitor badging, secure document shredding, and physical access controls to server rooms and archives.',
          content: `### 1. Clean Desk Policy
All physical patient records, printed lab results, and medication charts must be locked inside filing cabinets or medication carts when unattended.

### 2. Secure Document Disposal
Paper documents containing PHI must be deposited into designated locked shredding bins, never disposed of in standard municipal waste bins.

### 3. Facility Badging
All hospital staff and visiting consultants must visibly wear their Hemas security badges at all times.`,
          category: 'Physical & Environmental Security',
          version: '1.0',
          status: 'Published',
          effectiveDate: new Date('2026-02-15'),
          publishedAt: new Date('2026-02-15'),
          changelog: 'Initial baseline release.',
          createdBy: secUser._id,
          updatedBy: secUser._id,
        },
        {
          title: 'Acceptable Use of Hospital Telemedicine Platforms & AI Tools',
          description:
            'Draft guidelines governing the use of cloud-based telemedicine tools and generative AI in diagnostic workflows.',
          content: `### Draft Policy Under IT Security Review
This document outlines acceptable use parameters for remote patient consultations and strictly prohibits inputting identifiable patient records into external generative AI systems.`,
          category: 'Acceptable Use Policy',
          version: '0.9',
          status: 'Draft',
          effectiveDate: new Date('2026-03-01'),
          changelog: 'Initial draft for review by Medical Board and IT Security.',
          createdBy: secUser._id,
          updatedBy: secUser._id,
        },
      ]);

    console.log('🎓 Creating Security Awareness Training Modules & Interactive Quizzes...');
    const now = new Date();
    const futureDueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

    // Module 1: Patient Data Confidentiality
    const mod1 = await TrainingModule.create({
      title: 'Patient Data Confidentiality & EMR Access Controls',
      description:
        'Essential healthcare cybersecurity training on safeguarding electronic medical records, avoiding privacy leaks, and adhering to HIPAA/GDPR clinical data privacy standards.',
      category: 'Patient Data Confidentiality',
      durationMinutes: 15,
      passingScore: 80,
      version: '1.0',
      status: 'Published',
      dueDate: futureDueDate,
      createdBy: secUser._id,
      content: {
        introduction:
          'In a high-intensity hospital environment, patient trust depends heavily on data confidentiality. This module teaches you how to recognize data privacy risks, protect patient dignity, and avoid unintentional electronic health record disclosures.',
        sections: [
          {
            title: '1. The "Need-to-Know" Rule in Clinical Practice',
            body: 'Hospital staff may only inspect medical charts of patients actively assigned under their care. Accessing records of family members, public figures, or colleagues out of curiosity is an immediate breach of medical confidentiality and punishable by termination of employment.',
            icon: 'shield-check',
            highlights: [
              'Never search for patients outside your assigned ward',
              'Audit logs track every single chart lookup by user and timestamp',
              'Viewing records of colleagues without clinical justification is strictly prohibited',
            ],
          },
          {
            title: '2. Digital Communication and Patient Data',
            body: 'Commercial consumer apps such as WhatsApp, Telegram, or personal Gmail accounts do not have enterprise encryption or Business Associate compliance agreements with Hemas Hospitals. Clinical consultations must occur exclusively on authorized hospital systems.',
            icon: 'message-square-off',
            highlights: [
              'No patient diagnostic photos on personal phones',
              'Use only hospital-sanctioned secure internal portals',
              'Always redact identifying details when discussing cases in educational settings',
            ],
          },
          {
            title: '3. Physical Privacy at Reception & Nursing Counters',
            body: 'Keep monitors angled away from patient waiting areas. When printing patient summaries or discharge notes, retrieve them immediately from the network printer tray before unauthorized individuals can view them.',
            icon: 'eye-off',
            highlights: [
              'Always lock your terminal when stepping away even for 30 seconds',
              'Do not leave printed discharge summaries in open trays',
              'Ensure consultations are conducted with acoustic and visual privacy',
            ],
          },
        ],
        examples: [
          {
            scenario:
              'A nurse receives a phone call from someone claiming to be a patient’s relative asking for blood test results and HIV status.',
            correctAction:
              'Verify caller identity against the patient’s authorized contact list and consult the attending physician before disclosing any sensitive medical information.',
            riskLevel: 'High',
            clinicalImpact:
              'Unauthorized disclosure of sensitive diagnoses can cause severe psychological distress, legal liability, and regulatory penalties.',
          },
          {
            scenario:
              'A doctor wants to share an interesting X-ray with an overseas colleague for an informal opinion via WhatsApp.',
            correctAction:
              'Use the official hospital PACS remote consultation portal where data is encrypted, logged, and de-identified.',
            riskLevel: 'High',
            clinicalImpact:
              'Unencrypted transmission of diagnostic imagery over commercial networks violates data sovereignty regulations.',
          },
        ],
        keyTakeaways: [
          'Access patient records only when directly relevant to your active clinical duty.',
          'Audit trails record every EMR click with your unique Employee ID.',
          'Always lock your computer workstation screen (Windows + L) when leaving the desk.',
          'Dispose of physical patient papers exclusively into locked shredder bins.',
        ],
      },
    });

    await Quiz.create({
      trainingModuleId: mod1._id,
      passingScore: 80,
      questions: [
        {
          questionId: 'q1_1',
          question:
            'Under what circumstances are you permitted to open and read a patient’s electronic medical record (EMR)?',
          options: [
            'Whenever I am curious about an interesting medical condition',
            'Only when directly providing healthcare services or carrying out assigned duties for that patient',
            'Whenever the patient is a friend or family member',
            'Only if the patient gave verbal permission to a colleague',
          ],
          correctAnswer: 1,
          explanation:
            'The Minimum Necessary Standard dictates that staff may only view patient records essential to their direct clinical or administrative responsibilities.',
        },
        {
          questionId: 'q1_2',
          question:
            'You need to consult an on-call specialist regarding an urgent patient condition. Which method of communication is acceptable?',
          options: [
            'Taking a photo of the patient chart and sending it via WhatsApp',
            'Posting the clinical case details on a private healthcare Facebook group',
            'Using the hospital’s approved secure EMR consultation messaging system',
            'Emailing the patient summary to the doctor’s personal Yahoo email address',
          ],
          correctAnswer: 2,
          explanation:
            'Only enterprise-sanctioned, encrypted communication platforms provide adequate data protection and maintain regulatory audit trails.',
        },
        {
          questionId: 'q1_3',
          question:
            'You print a patient discharge summary on a shared floor printer, but an emergency occurs on the ward. What should you do with the printout?',
          options: [
            'Leave it in the printer tray until you have time later in the day',
            'Ask any passing hospital visitor to hand it to you',
            'Ensure the printout is retrieved or securely safeguarded so unauthorized individuals cannot see it',
            'Throw it into the open paper recycling wastebasket',
          ],
          correctAnswer: 2,
          explanation:
            'Printed patient data left unattended in public trays constitutes a physical data leak. Always retrieve printouts immediately or dispose into locked shredding bins.',
        },
        {
          questionId: 'q1_4',
          question:
            'True or False: The hospital IT system logs every user account that opens or views any patient chart.',
          options: [
            'True: Every lookup is permanently logged in the audit trail with timestamp and user ID',
            'False: Only edits and changes are logged, not viewing',
          ],
          correctAnswer: 0,
          explanation:
            'Modern healthcare compliance architectures maintain immutable audit trails recording all read and write interactions with patient records.',
        },
      ],
    });

    // Module 2: Phishing Awareness
    const mod2 = await TrainingModule.create({
      title: 'Hospital Phishing & Malicious Email Defense',
      description:
        'Learn how to spot targeted spear-phishing attacks, fake medical supply invoices, credential harvest portals, and ransomware attachments.',
      category: 'Phishing Awareness',
      durationMinutes: 15,
      passingScore: 80,
      version: '1.0',
      status: 'Published',
      dueDate: futureDueDate,
      createdBy: secUser._id,
      content: {
        introduction:
          'Hospitals are prime targets for cybercrime syndicates seeking to deploy ransomware. Over 90% of cyber incidents begin with an employee clicking a malicious email link. This module trains your instincts to identify and neutralize deceptive emails.',
        sections: [
          {
            title: '1. Anatomy of a Healthcare Phishing Attack',
            body: 'Attackers frequently disguise emails as urgent requests from hospital leadership, vendor pharmaceutical invoices, or mandatory IT password resets. They use psychological urgency to trick you into acting before thinking.',
            icon: 'mail-warning',
            highlights: [
              'Look closely at the sender email domain (e.g., @hemas-hospitals-support.com vs official @securehemas.local)',
              'Be suspicious of urgent threats (e.g. "Your account will be terminated in 1 hour")',
              'Never enter your hospital password into web pages linked in unsolicited emails',
            ],
          },
          {
            title: '2. Suspicious Attachments and Malicious Macros',
            body: 'Never open unexpected attachments named `Invoice.zip`, `Patient_List.xlsm`, or `Urgent_Update.exe`. These often contain stealth malware designed to spread laterally across the hospital network.',
            icon: 'file-x',
            highlights: [
              'Avoid enabling Word/Excel macros for downloaded files',
              'Preview documents in sandbox mode or forward to IT Security for scanning',
            ],
          },
          {
            title: '3. How to Report Suspected Phishing in SecureHemas',
            body: 'If you receive a suspicious message, do not forward it to colleagues. Use the "Report Incident" module in SecureHemas and select "Phishing / Suspicious Email" so our security team can block the malicious sender hospital-wide.',
            icon: 'alert-triangle',
            highlights: [
              'Reporting takes less than 30 seconds',
              'Quick reporting protects other staff members from falling victim',
            ],
          },
        ],
        examples: [
          {
            scenario:
              'You receive an email from "Hemas IT Support <it-helpdesk@hemas-portal-update.xyz>" stating that all staff must click a link to verify their email password within 24 hours or lose access.',
            correctAction:
              'Recognize the suspicious non-hospital domain (`.xyz`), do NOT click any links, and report the incident immediately.',
            riskLevel: 'Critical',
            clinicalImpact:
              'Entering credentials would compromise your hospital account, allowing attackers to access patient records and hospital infrastructure.',
          },
          {
            scenario:
              'A supplier emails an unexpected invoice in a password-protected `.zip` file asking pharmacy staff to open it immediately for medication delivery.',
            correctAction:
              'Verify the invoice with the procurement department via phone before extracting or opening any zip archives.',
            riskLevel: 'High',
            clinicalImpact:
              'Malicious archives can execute ransomware that paralyzes pharmacy dispensing systems.',
          },
        ],
        keyTakeaways: [
          'Verify sender email addresses carefully, especially for urgent messages.',
          'Hemas IT will NEVER ask for your password via email or text message.',
          'Report any suspicious email using the SecureHemas Incident reporting portal.',
        ],
      },
    });

    await Quiz.create({
      trainingModuleId: mod2._id,
      passingScore: 80,
      questions: [
        {
          questionId: 'q2_1',
          question:
            'You receive an urgent email from "HR Payroll" asking you to click a link to verify your bank details before today’s salary cut-off. What is the safest course of action?',
          options: [
            'Click the link immediately so your salary is not delayed',
            'Reply to the email with your password to confirm identity',
            'Check the sender’s full email address, do not click the link, and verify directly with HR through official internal phone extensions',
            'Forward the email to all other nurses in your ward to warn them',
          ],
          correctAnswer: 2,
          explanation:
            'Urgency regarding financial topics is a classic phishing hook. Always verify through known official channels without clicking suspicious links.',
        },
        {
          questionId: 'q2_2',
          question:
            'Which of the following sender email addresses is an obvious external phishing attempt impersonating Hemas Hospitals?',
          options: [
            'security@securehemas.local',
            'it-support@hemas-hospital-updates.com',
            'admin@securehemas.local',
            'hr@securehemas.local',
          ],
          correctAnswer: 1,
          explanation:
            '`@hemas-hospital-updates.com` is an external look-alike domain registered by attackers to deceive employees.',
        },
        {
          questionId: 'q2_3',
          question:
            'What should you do if you accidentally clicked a suspicious link and typed in your hospital login credentials?',
          options: [
            'Do nothing and hope the attackers did not notice',
            'Immediately contact IT Security (Ext. 4444) / report via SecureHemas to reset your credentials and isolate potential sessions',
            'Wait until your next scheduled shift to inform a supervisor',
            'Delete the browser history and restart the computer',
          ],
          correctAnswer: 1,
          explanation:
            'Immediate reporting allows IT Security to revoke compromised session tokens, force password resets, and prevent unauthorized lateral movement.',
        },
        {
          questionId: 'q2_4',
          question:
            'True or False: Legitimate IT Security administrators will occasionally email you asking for your password to perform maintenance.',
          options: [
            'True: Administrators need passwords for routine updates',
            'False: IT staff have administrative access and will NEVER ask for your password',
          ],
          correctAnswer: 1,
          explanation:
            'Legitimate administrators never need your password. Any request for your password is an indicator of malicious social engineering.',
        },
      ],
    });

    // Module 3: Social Engineering & Physical Security
    const mod3 = await TrainingModule.create({
      title: 'Social Engineering & Physical Security in Hospital Wards',
      description:
        'Defend against pretexting, tailgating into restricted clinical areas, visitor impersonation, and telephone deception tactics.',
      category: 'Social Engineering',
      durationMinutes: 12,
      passingScore: 80,
      version: '1.0',
      status: 'Published',
      dueDate: futureDueDate,
      createdBy: secUser._id,
      content: {
        introduction:
          'Social engineering exploits human kindness and helpfulness rather than software vulnerabilities. In healthcare, where staff are naturally compassionate, attackers use deception to gain unauthorized physical access or confidential data.',
        sections: [
          {
            title: '1. Preventing "Tailgating" into Restricted Units',
            body: 'Tailgating occurs when an unauthorized individual follows an authorized staff member through a badge-protected security door (e.g. ICU, Operating Theaters, Server Rooms, Pharmacy Vaults).',
            icon: 'door-closed',
            highlights: [
              'Always ensure the electronic magnetic door closes firmly behind you',
              'Politely challenge unfamiliar individuals without visible hospital ID badges: "May I assist you in finding the visitor reception?"',
              'Never hold secure doors open for unbadged persons claiming to be technicians',
            ],
          },
          {
            title: '2. Phone Pretexting & Urgent Inquiries',
            body: 'Attackers may call nursing stations pretending to be attending physicians or health ministry inspectors demanding immediate patient records or system access.',
            icon: 'phone-call',
            highlights: [
              'Verify caller identity using official hospital phone directories',
              'Never read confidential patient diagnoses or staff home addresses over the phone to unverified callers',
            ],
          },
        ],
        examples: [
          {
            scenario:
              'A person wearing scrubs and carrying a clipboard walks behind you toward the restricted ICU medication room, asking you to hold the door open because their hands are full.',
            correctAction:
              'Politely explain that hospital security policy requires all personnel to scan their own individual access badges at restricted checkpoints.',
            riskLevel: 'High',
            clinicalImpact:
              'Allowing unauthorized access risks drug diversion, physical tampering with medical equipment, or patient safety compromises.',
          },
        ],
        keyTakeaways: [
          'Every staff member must swipe their own ID badge at electronic access doors.',
          'Never disclose confidential clinical information to unverified telephone callers.',
          'Wear your hospital ID badge visibly at all times.',
        ],
      },
    });

    await Quiz.create({
      trainingModuleId: mod3._id,
      passingScore: 80,
      questions: [
        {
          questionId: 'q3_1',
          question:
            'What is "tailgating" in the context of physical cybersecurity?',
          options: [
            'Driving too closely behind an ambulance on the highway',
            'An unauthorized person following closely behind an authorized employee through a secure access door',
            'Sending duplicate emails to the IT helpdesk',
            'Using an expired login session on a workstation',
          ],
          correctAnswer: 1,
          explanation:
            'Tailgating is physical social engineering where an intruder exploits courtesy to bypass access controls.',
        },
        {
          questionId: 'q3_2',
          question:
            'An unfamiliar individual in plain clothes approaches the nurse station stating they are from biomedical support to inspect the defibrillator. How should you respond?',
          options: [
            'Immediately grant them full access without question',
            'Check for their official Hemas contractor badge and verify their visit with the Facilities/Biomedical Engineering supervisor before granting access',
            'Leave them alone in the room while you attend to other patients',
            'Hand them your login credentials to test the equipment',
          ],
          correctAnswer: 1,
          explanation:
            'All external technicians must be verified and badged before accessing critical life-support medical hardware.',
        },
        {
          questionId: 'q3_3',
          question:
            'True or False: It is acceptable to share your electronic RFID door access badge with a colleague who forgot theirs at home.',
          options: [
            'True: As long as you trust the colleague',
            'False: Badges are non-transferable; the colleague must obtain a temporary badge from Security',
          ],
          correctAnswer: 1,
          explanation:
            'Badges provide an individual audit trail for physical perimeter access and must never be loaned or shared.',
        },
      ],
    });

    // Module 4: Clinical Password Hygiene
    const mod4 = await TrainingModule.create({
      title: 'Clinical Password Hygiene & Workstation Session Locking',
      description:
        'Best practices for strong passphrase construction, multi-factor authentication (MFA), password managers, and rapid screen-locking in wards.',
      category: 'Password Hygiene',
      durationMinutes: 10,
      passingScore: 80,
      version: '1.0',
      status: 'Published',
      dueDate: futureDueDate,
      createdBy: secUser._id,
      content: {
        introduction:
          'Passphrases are the first line of defense for clinical computing systems. Weak, reused, or written-down passwords place the entire hospital network at risk of compromise.',
        sections: [
          {
            title: '1. Creating Memorable & Secure Passphrases',
            body: 'Instead of hard-to-remember short passwords like \`P@ss12\`, use long passphrases combining 4 or more random words: e.g., \`Kandy#Monsoon#Healing*Echo9\`. Length provides exponential cryptographic resistance against brute-force cracking.',
            icon: 'key',
            highlights: [
              'Minimum 12 characters required',
              'Never reuse your personal social media passwords for hospital systems',
              'Never write passwords on sticky notes attached to workstation monitors',
            ],
          },
          {
            title: '2. The 3-Second Rule: Lock Before You Walk',
            body: 'Whenever leaving a clinical computer, press \`Windows Key + L\` (or \`Control + Command + Q\` on Mac). An unlocked terminal allows anyone to view patient records, write unauthorized prescriptions, or alter dosages under your identity.',
            icon: 'lock',
            highlights: [
              'You are legally accountable for all actions performed under your logged-in account',
              'Automatic timeouts exist as a backup, not as a replacement for active locking',
            ],
          },
        ],
        examples: [
          {
            scenario:
              'A nurse writes their EMR password on a sticky note placed underneath the keyboard so relief staff can log in quickly during shift handovers.',
            correctAction:
              'Remove and shred the sticky note immediately. Each nurse must log in using their own unique credentials.',
            riskLevel: 'High',
            clinicalImpact:
              'Shared passwords invalidate clinical accountability, making it impossible to determine who administered medications or modified patient notes.',
          },
        ],
        keyTakeaways: [
          'Never write down passwords or leave them in visible places.',
          'Always lock your terminal when stepping away.',
          'Use unique, strong passphrases with 12+ characters.',
        ],
      },
    });

    await Quiz.create({
      trainingModuleId: mod4._id,
      passingScore: 80,
      questions: [
        {
          questionId: 'q4_1',
          question:
            'Which of the following keyboard shortcuts instantly locks a Windows clinical computer workstation?',
          options: [
            'Ctrl + Alt + Delete only',
            'Windows Key + L',
            'Alt + F4',
            'Ctrl + Shift + Esc',
          ],
          correctAnswer: 1,
          explanation:
            'Pressing `Windows Key + L` immediately locks the desktop, requiring your password to resume access.',
        },
        {
          questionId: 'q4_2',
          question:
            'Which of the following passwords is the strongest and safest for hospital system access?',
          options: [
            'Hemas2026',
            'Doctor#1',
            'Lotus*Monsoon#Healing$92',
            'password1234',
          ],
          correctAnswer: 2,
          explanation:
            'A multi-word passphrase with symbols and numbers (`Lotus*Monsoon#Healing$92`) offers maximum entropy against cracking.',
        },
        {
          questionId: 'q4_3',
          question:
            'True or False: If another staff member enters an order on your unlocked computer, the audit log will record YOU as the author.',
          options: [
            'True: Actions performed on your logged-in account are legally tied to your credentials',
            'False: The computer automatically detects who was typing',
          ],
          correctAnswer: 0,
          explanation:
            'Systems attribute actions to the active session. You are accountable for all actions taken under your account.',
        },
      ],
    });

    // Module 5: Device & Endpoint Security
    const mod5 = await TrainingModule.create({
      title: 'Medical Device Security & Mobile Endpoint Protection',
      description:
        'Security protocols for mobile diagnostic tablets, wireless telemetry equipment, and preventing malware infections from unauthorized USB drives.',
      category: 'Device Security',
      durationMinutes: 10,
      passingScore: 80,
      version: '1.0',
      status: 'Published',
      dueDate: futureDueDate,
      createdBy: secUser._id,
      content: {
        introduction:
          'Modern hospitals rely on hundreds of connected endpoints—from bedside vital monitors to mobile tablets. Securing these endpoints is vital to patient safety and uninterrupted healthcare delivery.',
        sections: [
          {
            title: '1. USB & Removable Media Restrictions',
            body: 'Plugging personal USB flash drives, cameras, or smartphones into hospital computers can introduce worms or extract sensitive data without detection. USB ports on clinical workstations are monitored and restricted.',
            icon: 'usb',
            highlights: [
              'Do not charge personal mobile devices using diagnostic computer USB ports',
              'Use approved encrypted cloud transfer systems managed by IT',
            ],
          },
          {
            title: '2. Mobile Tablets & Physical Custody',
            body: 'Tablets used for bedside nursing or digital consent forms must be returned to locked charging docks at the end of each shift.',
            icon: 'tablet',
            highlights: [
              'Never leave mobile diagnostic devices unattended in patient rooms or waiting lobbies',
              'Immediately report missing or misplaced devices via SecureHemas',
            ],
          },
        ],
        examples: [
          {
            scenario:
              'A visitor asks to charge their iPhone by plugging a USB cable into an active patient bedside cardiac telemetry monitor.',
            correctAction:
              'Politely decline and direct the visitor to public charging stations in the hospital lobby.',
            riskLevel: 'Critical',
            clinicalImpact:
              'Plugging unauthorized consumer devices into life-critical medical equipment can cause power fluctuations or malware infections.',
          },
        ],
        keyTakeaways: [
          'Never connect unauthorized USB drives or charging cables to hospital medical devices.',
          'Store mobile tablets in locked docking stations when not in use.',
          'Report lost or stolen hospital devices immediately.',
        ],
      },
    });

    await Quiz.create({
      trainingModuleId: mod5._id,
      passingScore: 80,
      questions: [
        {
          questionId: 'q5_1',
          question:
            'Is it permitted to charge your personal mobile phone by plugging it into a USB port on a nursing station computer or diagnostic ultrasound machine?',
          options: [
            'Yes, as long as you only use it for charging and not file transfers',
            'No, connecting personal consumer devices to hospital computers is strictly prohibited',
            'Yes, if you ask a colleague first',
            'Only if the phone has an antivirus app installed',
          ],
          correctAnswer: 1,
          explanation:
            'Connecting smartphones to clinical devices creates data leakage risks and potential hardware malfunctions.',
        },
        {
          questionId: 'q5_2',
          question:
            'You realize a ward tablet used for patient vital signs recording is missing from its charging bay. What is the required procedure?',
          options: [
            'Wait a couple of days to see if someone returns it',
            'Immediately submit an incident report on SecureHemas under "Lost Device" so IT Security can initiate remote wipe and lock',
            'Purchase a replacement tablet from an electronics store',
            'Assume it was discarded and do nothing',
          ],
          correctAnswer: 1,
          explanation:
            'Immediate reporting allows IT Security to execute cryptographic remote lock and wipe, protecting any cached patient records.',
        },
        {
          questionId: 'q5_3',
          question:
            'True or False: Networked medical devices operate on an isolated hospital VLAN to prevent unauthorized access from public guest Wi-Fi.',
          options: [
            'True: Medical equipment is segmented into protected network zones',
            'False: All hospital computers and patient smartphones share one open network',
          ],
          correctAnswer: 0,
          explanation:
            'Network segmentation ensures critical life-support systems are protected from guest networks and public internet traffic.',
        },
      ],
    });

    console.log('✍️ Generating Initial Policy Acknowledgements & Training Progress...');
    // Seed initial acknowledgements to make compliance dashboard look realistic
    await PolicyAcknowledgement.insertMany([
      {
        policyId: policyPHI._id,
        policyVersion: policyPHI.version,
        userId: staffUser._id,
        acknowledgedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.10.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        policyId: policyPassword._id,
        policyVersion: policyPassword.version,
        userId: staffUser._id,
        acknowledgedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.10.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        policyId: policyPHI._id,
        policyVersion: policyPHI.version,
        userId: staffKamal._id,
        acknowledgedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.10.62',
      },
      {
        policyId: policyPassword._id,
        policyVersion: policyPassword.version,
        userId: staffKamal._id,
        acknowledgedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.10.62',
      },
      {
        policyId: policyPHI._id,
        policyVersion: policyPHI.version,
        userId: staffAnusha._id,
        acknowledgedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.20.12',
      },
      {
        policyId: policyDevice._id,
        policyVersion: policyDevice.version,
        userId: staffAnusha._id,
        acknowledgedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.20.12',
      },
      {
        policyId: policyPHI._id,
        policyVersion: policyPHI.version,
        userId: staffDilshan._id,
        acknowledgedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.30.88',
      },
      {
        policyId: policyPassword._id,
        policyVersion: policyPassword.version,
        userId: staffDilshan._id,
        acknowledgedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.30.88',
      },
      {
        policyId: policyPHI._id,
        policyVersion: policyPHI.version,
        userId: headUser._id,
        acknowledgedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.10.5',
      },
      {
        policyId: policyPassword._id,
        policyVersion: policyPassword.version,
        userId: headUser._id,
        acknowledgedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.10.5',
      },
    ]);

    // Seed initial Training Progress
    await TrainingProgress.insertMany([
      {
        userId: staffUser._id,
        trainingModuleId: mod1._id,
        status: 'Completed',
        score: 100,
        attempts: 1,
        startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        dueDate: futureDueDate,
      },
      {
        userId: staffUser._id,
        trainingModuleId: mod2._id,
        status: 'In Progress',
        score: 50,
        attempts: 1,
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dueDate: futureDueDate,
      },
      {
        userId: staffKamal._id,
        trainingModuleId: mod1._id,
        status: 'Completed',
        score: 100,
        attempts: 1,
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dueDate: futureDueDate,
      },
      {
        userId: staffKamal._id,
        trainingModuleId: mod2._id,
        status: 'Completed',
        score: 100,
        attempts: 1,
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueDate: futureDueDate,
      },
      {
        userId: staffAnusha._id,
        trainingModuleId: mod1._id,
        status: 'Completed',
        score: 75,
        attempts: 2,
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        dueDate: futureDueDate,
      },
      {
        userId: staffAnusha._id,
        trainingModuleId: mod5._id,
        status: 'Completed',
        score: 100,
        attempts: 1,
        startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        dueDate: futureDueDate,
      },
      {
        userId: staffDilshan._id,
        trainingModuleId: mod1._id,
        status: 'Completed',
        score: 100,
        attempts: 1,
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueDate: futureDueDate,
      },
      {
        userId: staffPriyanka._id,
        trainingModuleId: mod1._id,
        status: 'Completed',
        score: 100,
        attempts: 1,
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dueDate: futureDueDate,
      },
    ]);

    console.log('🚨 Creating Realistic Cybersecurity Incidents...');
    await Incident.insertMany([
      {
        incidentNumber: 'INC-2026-0001',
        reportedBy: staffKamal._id,
        incidentType: 'Phishing',
        title: 'Suspicious Email Claiming Urgent Lab Reagent Delivery with Attachment',
        description:
          'Received an email from external address "support@hemas-lab-reagents.net" containing a password-protected zip file claiming to be emergency blood reagent delivery invoices.',
        priority: 'High',
        status: 'In Review',
        department: deptER._id,
        assignedTo: secUser._id,
        notes: [
          {
            author: secUser._id,
            note: 'Domain blocked on perimeter firewall. Mail gateway rule added to quarantine all messages from this sender.',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        ],
      },
      {
        incidentNumber: 'INC-2026-0002',
        reportedBy: staffUser._id,
        incidentType: 'Unauthorized Access',
        title: 'Unattended Clinical Workstation Left Logged In at Ward 3B Counter',
        description:
          'Found a nursing workstation at Ward 3B logged into the central EMR system with patient charts visible while staff were in the break room.',
        priority: 'Medium',
        status: 'Resolved',
        department: deptNursing._id,
        assignedTo: secUser._id,
        resolutionNotes:
          'Workstation locked by staff nurse. Inactivity timer verified at 3 minutes. Reminded shift nursing team on password hygiene guidelines.',
        resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        incidentNumber: 'INC-2026-0003',
        reportedBy: staffDilshan._id,
        incidentType: 'Lost Device',
        title: 'Misplaced Pharmacy Inventory Barcode Scanner Tablet',
        description:
          'Handheld inventory tablet #PHARM-TAB-04 was not returned to the docking station after the evening medication stock audit.',
        priority: 'High',
        status: 'Open',
        department: deptPharmacy._id,
        assignedTo: secUser._id,
      },
      {
        incidentNumber: 'INC-2026-0004',
        reportedBy: staffAnusha._id,
        incidentType: 'Password/Security Issue',
        title: 'Repeated Failed Login Alerts on PACS Radiology Server Terminal',
        description:
          'Observed multiple failed login lockouts on the primary PACS imaging workstation early this morning before diagnostic shift began.',
        priority: 'Critical',
        status: 'In Review',
        department: deptRadiology._id,
        assignedTo: secUser._id,
      },
    ]);

    console.log('🔔 Creating In-App Notifications...');
    await Notification.insertMany([
      {
        userId: staffUser._id,
        title: 'New Policy Published',
        message:
          'Policy "Patient Health Information (PHI) Confidentiality & Data Privacy Policy" (v2.0) requires your acknowledgement.',
        type: 'policy',
        link: `/policies/${policyPHI._id}`,
        isRead: true,
      },
      {
        userId: staffUser._id,
        title: 'Security Awareness Training Assigned',
        message:
          'You have been enrolled in "Hospital Phishing & Malicious Email Defense". Due in 14 days.',
        type: 'training',
        link: `/training/${mod2._id}`,
        isRead: false,
      },
      {
        userId: staffUser._id,
        title: 'Incident INC-2026-0002 Resolved',
        message: 'Your reported security incident regarding Ward 3B workstation has been resolved.',
        type: 'incident',
        link: `/incidents`,
        isRead: false,
      },
      {
        userId: headUser._id,
        title: 'Department Compliance Digest',
        message:
          'Emergency & Trauma Care overall compliance score reached 88%. 2 training modules due this month.',
        type: 'system',
        link: `/compliance`,
        isRead: false,
      },
      {
        userId: secUser._id,
        title: '🚨 Critical Incident Reported: INC-2026-0004',
        message:
          'Anusha Senanayake reported Critical issue: Repeated Failed Login Alerts on PACS Radiology Server.',
        type: 'incident',
        link: `/incidents`,
        isRead: false,
      },
    ]);

    console.log('🛡️ Creating Initial Tamper-Evident Audit Trail...');
    await AuditLog.insertMany([
      {
        userId: secUser._id,
        userEmail: secUser.email,
        userRole: 'IT_SECURITY_ADMIN',
        action: 'PUBLISH_POLICY',
        module: 'POLICIES',
        entityId: policyPHI._id.toString(),
        timestamp: new Date('2026-01-01T08:30:00Z'),
        ipAddress: '192.168.10.1',
        metadata: { title: policyPHI.title, version: '2.0' },
      },
      {
        userId: secUser._id,
        userEmail: secUser.email,
        userRole: 'IT_SECURITY_ADMIN',
        action: 'CREATE_TRAINING',
        module: 'TRAINING',
        entityId: mod1._id.toString(),
        timestamp: new Date('2026-01-05T09:15:00Z'),
        ipAddress: '192.168.10.1',
        metadata: { title: mod1.title, passingScore: 80 },
      },
      {
        userId: staffUser._id,
        userEmail: staffUser.email,
        userRole: 'STAFF',
        action: 'LOGIN',
        module: 'AUTH',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.10.45',
        metadata: { site: 'Hemas Hospital Wattala', position: 'Senior Nursing Officer' },
      },
      {
        userId: staffUser._id,
        userEmail: staffUser.email,
        userRole: 'STAFF',
        action: 'ACKNOWLEDGE_POLICY',
        module: 'POLICIES',
        entityId: policyPHI._id.toString(),
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 120000),
        ipAddress: '192.168.10.45',
        metadata: { policyTitle: policyPHI.title, policyVersion: '2.0' },
      },
      {
        userId: staffUser._id,
        userEmail: staffUser.email,
        userRole: 'STAFF',
        action: 'COMPLETE_TRAINING',
        module: 'TRAINING',
        entityId: mod1._id.toString(),
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.10.45',
        metadata: { trainingTitle: mod1.title, finalScore: 100 },
      },
      {
        userId: staffKamal._id,
        userEmail: staffKamal.email,
        userRole: 'STAFF',
        action: 'CREATE_INCIDENT',
        module: 'INCIDENTS',
        entityId: 'INC-2026-0001',
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
        ipAddress: '192.168.10.62',
        metadata: { incidentNumber: 'INC-2026-0001', priority: 'High', type: 'Phishing' },
      },
    ]);

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║             SECUREHEMAS DATABASE SEED COMPLETE                 ║
╠════════════════════════════════════════════════════════════════╣
║  Demo Accounts (Password for all: Password123!):              ║
║                                                                ║
║  1. Admin:             admin@securehemas.local                ║
║  2. IT Security Admin: security@securehemas.local             ║
║  3. Department Head:   head@securehemas.local                 ║
║  4. Hospital Staff:    staff@securehemas.local                ║
║                                                                ║
║  Additional Staff:                                             ║
║  • Emergency Nurse:    nurse.kamal@securehemas.local          ║
║  • Radiologist:        radiologist.anusha@securehemas.local   ║
║  • Pharmacist:         pharmacist.dilshan@securehemas.local   ║
║  • Billing Executive:  billing.priyanka@securehemas.local     ║
╚════════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('❌ Database Seeding Error:', error);
    throw error;
  }
};

// If run directly via CLI (e.g. ts-node src/seed/seedData.ts)
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      console.log('Seeding finished successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      process.exit(1);
    }
  })();
}
