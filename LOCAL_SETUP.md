# SHARKVISION — Local Setup and Development Guide
**Platform:** SHARKVISION (Commercial JEE / NEET Performance Intelligence Monolith)  
**Database:** PostgreSQL 16 (Local Service or Docker Container)  
**ORM:** Drizzle ORM  
**Authentication:** Local Database-Backed Auth Adapter (`AUTH_PROVIDER=local`)  
**Target Host:** AWS ECS Fargate / Amazon RDS PostgreSQL  

---

## 1. Prerequisites

- **Node.js:** v20.x or v22.x LTS
- **npm:** v10.x+
- **PostgreSQL 16:** Installed either as a Windows service or via Docker Desktop.
- **Port:** Local port 5432 (default) or 5433 for Docker mapping.

---

## 2. Docker & Database Setup

A production-ready `docker-compose.yml` is provided at the repository root:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: sharkvision_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: sharkvision
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - sharkvision_postgres_data:/var/lib/postgresql/data
```

### Starting the Docker PostgreSQL Service:
```bash
docker compose up -d
```
*(If running against host Windows PostgreSQL, verify the `postgresql-x64-17` service is running on port 5432).*

---

## 3. Environment Configuration

Ensure `.env.local` contains the following active keys:

```env
NODE_ENV=development
AUTH_PROVIDER=local
APP_SECRET=sharkvision_local_super_secure_jwt_dev_key_2026_xyz
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PostgreSQL Native Connection String
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sharkvision
POSTGRES_DB=sharkvision
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Client compatibility keys
NEXT_PUBLIC_SUPABASE_URL=https://placeholder-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-key
```

---

## 4. Database Migrations & Seeding Commands

### 1. Run Native PostgreSQL Migrations:
Provisions all 22 relational tables, enums, composite indices, and cascading foreign keys:
```bash
npx tsx src/lib/db/migrate.ts
```

### 2. Seed Development Database:
Creates verified accounts across all 4 user roles, institutions, batches, question benchmarks, and a 50-question full-length mock examination:
```bash
npx tsx src/lib/db/seed.ts
```

### 3. Development Database Reset (Safety Gated):
Drops and recreates the public schema. Refuses to run against production or AWS RDS:
```bash
npx tsx src/lib/db/reset-dev.ts
# Requires typing: RESET_LOCAL_DEV
```

---

## 5. Development Test Accounts

All seeded test accounts share the same development password:  
**Password:** `SharkVision@2026`

| Role | Email Address | Linked Entity / Batch |
| :--- | :--- | :--- |
| **Super Admin** | `admin@sharkvision.com` | Full platform administrative oversight |
| **Teacher** | `teacher.physics@sharkvision.com` | Physics HOD, Kota Center Batch A |
| **Teacher** | `teacher.math@sharkvision.com` | Mathematics HOD, Kota Center Batch A |
| **Parent** | `parent.verma@sharkvision.com` | Verified linked parent of Aarav Verma |
| **Parent** | `parent.iyer@sharkvision.com` | Verified linked parent of Diya Iyer |
| **Student** | `student.aarav@sharkvision.com` | Enrolled in JEE Advanced Super-30 Batch A |
| **Student** | `student.diya@sharkvision.com` | Enrolled in JEE Advanced Super-30 Batch A |
| **Student** | `student.rohan@sharkvision.com` | Enrolled in JEE Advanced Super-30 Batch A |
| **Student** | `student.ananya@sharkvision.com`| Enrolled in JEE Advanced Super-30 Batch A |
| **Student** | `student.kabir@sharkvision.com`| Enrolled in JEE Advanced Super-30 Batch A |

---

## 6. Running the Application

Start the local development server:
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## 7. Troubleshooting

- **Port 5432 conflict:** If port 5432 is already used by an existing local service, edit `docker-compose.yml` to map `"5433:5432"` and update `DATABASE_URL` in `.env.local` to use port `5433`.
- **Database Connection Refused:** Verify that PostgreSQL is running via `netstat -ano | findstr 5432` or `docker ps`.
- **Session Issues:** Clear the `sv_session_token` cookie from your browser storage and sign in again.
