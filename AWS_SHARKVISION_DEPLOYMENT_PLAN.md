# SharkVision AWS Production Deployment Plan

**Document:** AWS_SHARKVISION_DEPLOYMENT_PLAN.md  
**Account:** `154586926909` (us-east-1)  
**Target Domain:** `https://aws.adepukrishnakumar.in/`  
**Execution Mode:** Staged Blue/Green Cutover (Non-destructive)  

---

## 1. Overview & Strategy

This deployment replaces the existing, stopped AWS Cost Optimization application (`aws-apn-staging`) with **SharkVision**.

To maximize efficiency and minimize cost, we reuse:
- **Networking & Routing:** Default VPC (`vpc-0188cd15cf9543b23`), Subnets, Route 53 Hosted Zone (`adepukrishnakumar.in.`), ACM TLS Wildcard Certificate.
- **Load Balancing:** Existing ALB (`aws-apn-staging-alb`) and HTTPS Listener (Port 443).
- **Compute Cluster:** Existing Fargate Cluster (`aws-apn-staging-cluster`).
- **Database Engine:** Existing RDS PostgreSQL 18.3 instance (`aws-apn-staging`), provisioning an isolated logical database `sharkvision` to keep the Cost Optimization schema 100% untouched.

---

## 2. Step-by-Step Execution Sequence

### Phase A: Database Activation & Provisioning
1. **Start RDS PostgreSQL Instance:**
   - Execute: `aws rds start-db-instance --db-instance-identifier aws-apn-staging`
   - Wait until instance status transitions from `starting` to `available`.
2. **Retrieve Master Password:**
   - Read master credentials securely from AWS Secrets Manager `rds!db-da89f102-cc62-49f1-b3c2-10b9f9ef26ea`.
3. **Provision Isolated SharkVision Database:**
   - Connect to RDS master endpoint: `aws-apn-staging.c4d8m2046cne.us-east-1.rds.amazonaws.com:5432`.
   - Run:
     ```sql
     CREATE DATABASE sharkvision;
     CREATE USER sharkvision_app WITH ENCRYPTED PASSWORD '<GENERATED_SECURE_PASSWORD>';
     GRANT ALL PRIVILEGES ON DATABASE sharkvision TO sharkvision_app;
     ```
4. **Apply Native Migrations:**
   - Apply `postgres_native_schema.sql` to the `sharkvision` database.
   - Run the demo seed script (`scripts/seed-executive-demo.ts`) to pre-seed the Executive Demo test and system baseline accounts.

---

### Phase B: Cognito Authentication Configuration
1. **Create or Configure SharkVision App Client:**
   - Under User Pool `us-east-1_zjzj8nhaA` (or a dedicated `sharkvision-users` pool):
   - Configure App Client `sharkvision-web` with `ALLOW_USER_PASSWORD_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`.
   - Add standard user attributes (`email`, `name`, `custom:role`).
2. **Store Production Secrets:**
   - Create AWS Secrets Manager Secret `sharkvision/production/config`:
     ```json
     {
       "DATABASE_URL": "postgres://sharkvision_app:<PASSWORD>@aws-apn-staging.c4d8m2046cne.us-east-1.rds.amazonaws.com:5432/sharkvision?sslmode=require",
       "APP_SECRET": "<RANDOM_64_CHAR_HEX_TOKEN>",
       "AUTH_PROVIDER": "cognito",
       "NEXT_PUBLIC_COGNITO_USER_POOL_ID": "us-east-1_zjzj8nhaA",
       "NEXT_PUBLIC_COGNITO_CLIENT_ID": "<CLIENT_ID>",
       "COGNITO_REGION": "us-east-1"
     }
     ```

---

### Phase C: Container Build & Push to ECR
1. **Create Dedicated ECR Repository:**
   - Execute: `aws ecr create-repository --repository-name sharkvision --image-scanning-configuration scanOnPush=true`
2. **Docker Build Locally:**
   - Build multi-stage standalone image:
     ```bash
     docker build -t sharkvision:latest .
     ```
3. **Tag & Push to ECR:**
   - Authenticate Docker to AWS ECR:
     ```bash
     aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 154586926909.dkr.ecr.us-east-1.amazonaws.com
     docker tag sharkvision:latest 154586926909.dkr.ecr.us-east-1.amazonaws.com/sharkvision:latest
     docker push 154586926909.dkr.ecr.us-east-1.amazonaws.com/sharkvision:latest
     ```

---

### Phase D: ECS Deployment & Staging Target Group
1. **Create CloudWatch Log Group:**
   - `/ecs/sharkvision` with 14-day retention.
2. **Create Target Group:**
   - Name: `sharkvision-tg`
   - Port: 3000, Protocol: HTTP, Target Type: `ip`, VPC: `vpc-0188cd15cf9543b23`
   - Health Check Path: `/api/health`
3. **Register Task Definition:**
   - Family: `sharkvision`
   - Memory: 1024 MB (1 GB), CPU: 512 (0.5 vCPU)
   - Task Role: `arn:aws:iam::154586926909:role/aws-apn-staging-backend-task-role`
   - Execution Role: `arn:aws:iam::154586926909:role/aws-apn-staging-ecs-execution-role`
4. **Deploy ECS Service:**
   - Service Name: `sharkvision-service`
   - Desired Tasks: 1
   - Security Group: `sg-0c694a3e4e336432f` (allows port 3000 from ALB)
   - Subnets: `subnet-0314d56f0137d1929`, `subnet-0b992fa2d62758d9b`
   - Attached to Target Group: `sharkvision-tg`
5. **Verify Healthy Status:**
   - Wait until ECS task is in `RUNNING` state and `sharkvision-tg` target health reports `healthy`.
