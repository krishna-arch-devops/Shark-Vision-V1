# SHARKVISION

Commercial SaaS platform for JEE Main, JEE Advanced, and NEET examination performance intelligence.

## "Know Where Every Second Goes."

SHARKVISION tracks question dwell time, option changing behavior, topic-level weaknesses, and examination strategies for Indian competitive entrance exam aspirants.

---

## 1. Quick Start

### Prerequisites
- Node.js 20+ (v24 recommended)
- Supabase PostgreSQL instance (Cloud or Local CLI)

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
copy .env.example .env.local
# Fill in your Supabase project URL, Anon Key, and Service Role Key

# 3. Apply database migrations
# Execute the SQL scripts in supabase/migrations/ on your Supabase SQL editor:
# - 20261112000001_initial_schema.sql
# - 20261112000002_bootstrap_admin.sql (to elevate initial super admin)

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 2. Key Commands
- `npm run dev`: Launch local development server.
- `npm run build`: Execute Next.js production build.
- `npm test`: Run automated unit and authorization test suites with Vitest.
- `npx tsc --noEmit`: Strict TypeScript type checking.

---

## 3. User Roles & Portals
- **Super Administrator**: `/admin` — System command center, user management, institutions, audit logs.
- **Teacher**: `/teacher` — Batch instruction, student rosters, question authoring, test monitoring.
- **Parent**: `/parent` — Verified child performance, plain-English effort and time management reports.
- **Student**: `/student` — Test console, accuracy benchmarks, dwell-time telemetry, revision plans.
