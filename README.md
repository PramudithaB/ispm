# SecureHemas 🛡️🏥

**Information Security Policy Awareness & Compliance Management System for Hemas Hospitals**  
*Full-Stack Web Application for University Cybersecurity Capstone Demonstration*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://www.mongodb.com/)

---

## 1. Project Overview

**SecureHemas** is an enterprise-grade web application engineered to centralize information security policy governance, healthcare staff compliance tracking, interactive awareness training, and incident triage across **Hemas Hospitals** facilities.

The application follows clinical cybersecurity best practices (HIPAA/GDPR compliance, least privilege, cryptographic authentication, and tamper-evident audit trails).

### Key Architectural Highlights:
* **Pure MongoDB + Mongoose Architecture**: Uses MongoDB as the primary and exclusive database (no PostgreSQL/MySQL/Supabase).
* **Zero-Config Embedded Fallback**: Automatically connects to MongoDB Atlas or spins up an embedded MongoDB instance for seamless local grading.
* **Strict Backend RBAC**: Middleware authorization enforced on every API route across 4 distinct roles: `STAFF`, `DEPARTMENT_HEAD`, `ADMIN`, and `IT_SECURITY_ADMIN`.
* **Mobile-First Staff Experience**: Tailored touch-friendly interfaces for nursing and clinical staff on shifts, paired with an executive power dashboard for administrators.

---

## 2. Core Modules & Features

### 📋 1. Policy Management & Versioning Lifecycle
* **Draft $\rightarrow$ Published $\rightarrow$ Archived** state machine.
* Automatic version archiving and changelog tracking upon modifications.
* Staff can browse, search by keyword, filter by clinical category/department, read full policy standards, and acknowledge with 1-click.
* **Duplicate Prevention**: Compound unique indexing prevents duplicate acknowledgements for the same policy version.
* Staff members only see the latest `Published` policies.

### 🎓 2. Security Training & Interactive Quiz Engine
* Healthcare-specific courses:
  1. *Patient Health Information (PHI) Confidentiality & EMR Access*
  2. *Hospital Phishing & Malicious Email Defense*
  3. *Social Engineering & Physical Security in Wards*
  4. *Clinical Password Hygiene & Workstation Session Locking*
  5. *Medical Device & Endpoint IoT Protection*
* Interactive learning viewer with clinical hospital scenarios and key rules.
* **Secure Quiz Engine**: Server-side grading where correct answers and rationales are **strictly sanitized** and never leaked prior to submission.
* 80% passing grade requirement with attempt tracking, immediate feedback, confetti grading celebrations, and in-depth clinical rationales.

### 📊 3. Real-Time Compliance Analytics & Drill-Down
* Dynamic compliance rate calculation calculated directly from MongoDB data.
* Department compliance comparison bar charts and system breakdown donuts.
* **Individual Employee Drill-Down**: Click any hospital department to inspect individual staff member policy acknowledgement rates, completed modules, and overdue flags.

### 🚨 4. Cybersecurity Incident Reporting & Triage
* Simple staff incident report portal (Phishing, Suspicious Email, Lost Device, Unauthorized Access, etc.).
* Automated incident numbering (`INC-2026-XXXX`).
* Security Admin triage workflow: `Open` $\rightarrow$ `In Review` $\rightarrow$ `Resolved`.
* Assignment to security personnel, resolution notes, and automated in-app notifications to reporters upon status changes.

### 🛡️ 5. Tamper-Evident Audit Trail
* Permanent, immutable security audit log capturing:
  * `LOGIN`, `LOGIN_FAILED`, `USER_LOCKED`, `LOGOUT`
  * `CREATE_POLICY`, `PUBLISH_POLICY`, `ACKNOWLEDGE_POLICY`
  * `CREATE_TRAINING`, `QUIZ_SUBMISSION`, `COMPLETE_TRAINING`
  * `CREATE_INCIDENT`, `UPDATE_INCIDENT`, `RESOLVE_INCIDENT`, `EXPORT_REPORT`
* Complete IP address tracking, user roles, timestamps, and JSON metadata inspector.

### 📥 6. Reports & CSV Data Exports
* Direct CSV report generation and printable views for:
  1. Department Compliance Matrix
  2. Incident Register
  3. Staff Training Matrix
  4. Audit Log Trail

---

## 3. Demo User Accounts

All demo accounts use the standard password: **`Password123!`**

| Role | Email | Name & Clinical Position | Access Level |
| :--- | :--- | :--- | :--- |
| **Hospital Admin** | `admin@securehemas.local` | Dr. Chaminda Perera (*CMIO & Compliance Lead*) | Full administrative & compliance control |
| **IT Security Admin** | `security@securehemas.local` | Kasun Jayawardena (*Lead Cybersecurity Officer*) | Full security triage, audit & policy control |
| **Department Head** | `head@securehemas.local` | Dr. Ruwani Fernando (*Head of Emergency & Trauma*) | Department compliance & staff oversight |
| **Hospital Staff** | `staff@securehemas.local` | Sanduni Wickramasinghe (*Senior Nursing Officer*) | Policies, training, quiz, incident reporting |
| **Emergency Nurse** | `nurse.kamal@securehemas.local` | Kamal Alwis (*Emergency Triage Nurse*) | Mobile staff workflows |
| **Radiologist** | `radiologist.anusha@securehemas.local` | Anusha Senanayake (*Senior Radiographer*) | Mobile staff workflows |
| **Pharmacist** | `pharmacist.dilshan@securehemas.local` | Dilshan Silva (*Clinical Pharmacist*) | Mobile staff workflows |

> [!TIP]
> On the login page, you can use the **1-Click Demo Account Buttons** to instantly log in as any role without manual typing.

---

## 4. Technology Stack

```
Frontend (React + Vite + TypeScript + Tailwind CSS)
                       │
             REST API JSON Requests
                       │
                       ▼
Backend (Node.js + Express + TypeScript)
  ├── Security Headers: Helmet
  ├── CORS & Express Rate Limiting
  ├── JWT Authentication & 5-Attempt Lockout
  ├── Role-Based Access Control (RBAC) Middleware
  └── Audit Logging Service
                       │
                       ▼
Database Layer (Mongoose + MongoDB)
  ├── Users, Departments, Policies, PolicyAcknowledgements
  ├── TrainingModules, Quizzes, TrainingProgress
  └── Incidents, Notifications, AuditLogs
```

---

## 5. Getting Started & Installation

### Prerequisites
* Node.js v18+ (tested on Node v22)
* npm v9+

### 1. Clone & Install Dependencies
```bash
git clone <repository_url>
cd ispm

# Install all root, server, and client dependencies
npm run install:all
```

### 2. Environment Configuration
The `.env` files are pre-configured out of the box. If you wish to connect to a remote MongoDB Atlas cluster, edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/securehemas?retryWrites=true&w=majority
JWT_SECRET=securehemas_jwt_super_secret_key_2026_clinical_defense_secure
JWT_REFRESH_SECRET=securehemas_jwt_refresh_super_secret_key_2026_clinical_defense_secure
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
*(Leave `MONGODB_URI` blank to use the built-in embedded MongoDB engine automatically).*

### 3. Seed Demonstration Database
Populates hospital departments, realistic policies, interactive training modules with quizzes, staff compliance profiles, incidents, and audit logs:
```bash
npm run seed
```

### 4. Start the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```

* **Frontend Application**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:5000/api`
* **API Health Check**: `http://localhost:5000/api/health`

---

## 6. Running Automated Tests

Run the full integration test suite covering Authentication, 5-Attempt Lockout, RBAC authorization boundaries, Policy lifecycle, Sanitized Quiz evaluation, Incident triage, and Audit logging:
```bash
npm run test
```

---

## 7. REST API Reference Overview

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Self-register a new hospital staff account.
* `POST /api/auth/login` — Authenticate and receive JWT (rate-limited, 5-attempt lockout).
* `POST /api/auth/logout` — Revoke session and record audit event.
* `GET /api/auth/me` — Retrieve active authenticated user profile.
* `PUT /api/auth/profile` — Update user profile and change password.

### Policies (`/api/policies`)
* `GET /api/policies` — List published policies (Staff) or all policies (Admin).
* `GET /api/policies/:id` — Get detailed policy standards and user acknowledgement status.
* `POST /api/policies` — Create new policy (Admin/IT only).
* `PUT /api/policies/:id` — Update policy and archive previous version (Admin/IT only).
* `POST /api/policies/:id/publish` — Publish policy and notify hospital staff (Admin/IT only).
* `POST /api/policies/:id/archive` — Archive policy (Admin/IT only).
* `POST /api/policies/:id/acknowledge` — Record staff policy acknowledgement.
* `GET /api/policies/:id/acknowledgements` — Inspect list of staff acknowledgements.

### Training & Quizzes (`/api/training`)
* `GET /api/training` — List training courses with user progress.
* `GET /api/training/:id` — Get course learning modules and scenario guidelines.
* `GET /api/training/:id/quiz` — Fetch **sanitized** quiz questions (answer keys stripped).
* `POST /api/training/:id/submit-quiz` — Evaluate quiz answers, calculate score, and record completion.

### Compliance & Analytics (`/api/compliance`)
* `GET /api/compliance/my` — Staff personal compliance score and checklist.
* `GET /api/compliance/summary` — Hospital-wide compliance KPIs (Admin/HOD).
* `GET /api/compliance/department` — Department compliance breakdown (Admin/HOD).
* `GET /api/compliance/department/:deptId` — Individual staff compliance drill-down.

### Incidents (`/api/incidents`)
* `GET /api/incidents` — List reported incidents.
* `POST /api/incidents` — Submit a new security incident.
* `PATCH /api/incidents/:id/status` — Update incident status (`Open` $\rightarrow$ `In Review` $\rightarrow$ `Resolved`).

### Audit Trail (`/api/audit-logs`)
* `GET /api/audit-logs` — Filterable audit trail queries (Admin/IT only).

### Reports (`/api/reports`)
* `GET /api/reports/compliance?format=csv` — Export Department Compliance Matrix.
* `GET /api/reports/incidents?format=csv` — Export Incident Register.
* `GET /api/reports/training?format=csv` — Export Training Completion Matrix.
* `GET /api/reports/audit-logs?format=csv` — Export Tamper-Evident Audit Trail.

---

## 8. Security Controls Summary

1. **Password Security**: Passwords are never stored in plaintext and are hashed using bcrypt with salt rounds of 10.
2. **Account Lockout**: After 5 consecutive failed login attempts, accounts are automatically locked for 15 minutes.
3. **No Password Exposure**: Password hashes are strictly omitted from JWT tokens and excluded from all API response payloads (`select: false`).
4. **Data Sanitization**: Quiz correct answers and explanations are scrubbed on the server and only provided after score submission.
5. **Role-Based Authorization**: RBAC rules are enforced in Node.js middleware; unauthorized requests receive HTTP 403 Forbidden.
6. **Network & Header Security**: Helmet HTTP headers, CORS whitelisting, and Express rate limiting active on sensitive endpoints.

---

## 9. License

Developed for the **Hemas Hospitals Information Security & Compliance Demonstration**. All rights reserved.
# ispm
