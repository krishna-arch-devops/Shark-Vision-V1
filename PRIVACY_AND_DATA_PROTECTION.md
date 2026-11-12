# SHARKVISION — Privacy and Data Protection Framework
**Regulatory Baseline:** Digital Personal Data Protection Act, 2023 (India — DPDP Act)  
**Classification:** Sensitive Educational & Behavioral Performance Telemetry  
**Audience:** Legal Counsel, Compliance Officers, System Administrators, Parents & Students  

---

## 1. Regulatory Context & Overview

SHARKVISION processes educational data for students preparing for high-stakes national competitive examinations in India (JEE Main/Advanced and NEET). A substantial proportion of candidates are aged 15–18 (legal minors under Indian law).

The platform conforms rigorously to the mandates of the **Digital Personal Data Protection Act, 2023 (DPDP Act)**, adhering to:
1. Lawful, fair, and transparent data processing.
2. Purpose limitation (data processed solely for assessment, learning remediation, and progress reporting).
3. Data minimization (only metrics strictly required for performance intelligence are recorded).
4. Verifiable parental consent and parental linkage mechanisms for minors.
5. Explicit prohibition of behavioral advertising, profiling for commercial exploitation, or biometric tracking.

---

## 2. Minor Protection & Parental Consent Architecture

### 2.1 Minor Classification & Linkage
- Students registering for the platform provide their demographic details and can optionally connect a parent/guardian.
- Linkage is governed by the `parent_student_links` table with `is_verified` boolean gating:
  - An unverified parent receives zero visibility into candidate telemetry, exam attempts, or behavioral analytics.
  - Linkage requires explicit mutual confirmation (e.g. invite token or candidate consent).
  - Once verified, parents gain access strictly to synthetic, non-judgmental summaries and progress digests via `/parent/children/[id]/digest`.

### 2.2 Prohibited Practices under Section 9 of the DPDP Act
- **No Behavioral Advertising:** Sharkvision has zero external advertising trackers, zero third-party marketing pixels (no Meta Pixel, no Google Tag Manager, no ad networks).
- **No Harmful Profiling:** Platform algorithms are 100% deterministic, explainable mathematical calculators (e.g. speed-accuracy matrices, counterfactual simulation). No opaque algorithmic tracking or psychological profiling occurs.
- **No Biometric Data:** Sharkvision does not record webcams, audio feeds, keystroke dynamics, or facial biometrics.

---

## 3. Data Collection, Minimization & Purpose Matrix

| Data Category | Specific Attributes | Lawful Purpose | Retention Policy |
| :--- | :--- | :--- | :--- |
| **Identity & Authentication** | Email, Name, Role, Encrypted Auth Credentials | User authentication, RBAC session management | Active lifecycle + 90 days post deletion |
| **Exam State Telemetry** | Monotonic question dwell time (ms), active timestamp, option selection | Accurate assessment grading, anti-lag reconciliation | Retained for candidate's academic year |
| **Behavioral Event Log** | Option change history, mark-for-review toggles | Counterfactual score recovery calculation, self-doubt analytics | Retained with attempt records |
| **Performance Analytics** | Accuracy %, speed per question, topic proficiency | Personalized revision generation, parent digests | Duration of subscription / enrollment |

---

## 4. Student & Parent Data Rights

Under DPDP Act Section 11–13, data principals and parents of minor candidates hold enforceable rights:

1. **Right to Access & Summary:**
   - Any student or verified parent can export their complete examination history, timing logs, and revision tasks.
2. **Right to Correction & Erasure:**
   - Account deletion triggers a cascading purge across all personal identification records, removing candidate names and contact details while archiving anonymized aggregate benchmark statistics.
3. **Right of Grievance Redressal:**
   - Dedicated support contact surfaced at `/privacy` and `/terms`. Grievance officer inquiries receive acknowledgment within 48 hours and resolution within 30 days.

---

## 5. Security & Isolation Controls

- **Database Row-Level Security (RLS):** All data access is enforced at the PostgreSQL kernel level using Supabase RLS. No student can view another student's attempts or analytics.
- **In-Transit & At-Rest Encryption:**
  - TLS 1.3 enforced for all client-server communications (`Strict-Transport-Security`).
  - PostgreSQL volumes encrypted at rest with AES-256.
- **Log Scrubbing:** Application logs are strictly scrubbed of personal identifiers, passwords, and sensitive question solutions (`src/lib/logger.ts`).
