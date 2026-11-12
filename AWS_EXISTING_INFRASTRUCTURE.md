# AWS Existing Infrastructure Inventory & Discovery Report

**Generated:** 2026-11-13  
**Target Domain:** `https://aws.adepukrishnakumar.in/`  
**Current Application Deployed:** AWS Cost Optimization / AWS APN Platform (`aws-apn-staging`)  
**Target Replacement Application:** SharkVision Examination & Performance Platform  

---

## 1. Executive Summary

A comprehensive, non-destructive discovery was conducted on the AWS account `154586926909` in region `us-east-1`. The existing deployment at `aws.adepukrishnakumar.in` is an AWS Cost Optimization staging application running on Amazon ECS Fargate fronted by an Application Load Balancer with an ACM TLS certificate and backed by Amazon RDS PostgreSQL (`postgres:18.3`, `db.t4g.micro`, currently stopped to conserve costs).

Because SharkVision is architected as a modular Next.js application that compiles into a standalone container, we can reuse the network, routing, TLS, and load balancing infrastructure with minimal friction and significant cost efficiency.

---

## 2. AWS Account & Identity Summary

| Property | Value |
| :--- | :--- |
| **AWS Account ID** | `154586926909` |
| **Active Identity ARN** | `arn:aws:iam::154586926909:root` |
| **Default Region** | `us-east-1` (N. Virginia) |
| **Authorization Status** | Full Administrator Access |

---

## 3. Discovered Infrastructure Components

### 3.1 DNS & Domain Routing (Amazon Route 53)
- **Hosted Zone ID:** `/hostedzone/Z05246898LBVAYJXHJB2` (`adepukrishnakumar.in.`)
- **Active Record Sets:**
  - `aws.adepukrishnakumar.in` (A ALIAS -> `aws-apn-staging-alb-466126827.us-east-1.elb.amazonaws.com.`)
  - `api.aws.adepukrishnakumar.in` (A ALIAS -> `aws-apn-staging-alb-466126827.us-east-1.elb.amazonaws.com.`)
  - ACM Certificate CNAME validation records for both subdomains.

### 3.2 TLS / SSL Certificates (AWS ACM)
- **Certificate ARN:** `arn:aws:acm:us-east-1:154586926909:certificate/4068708b-f9aa-4f68-9403-ef5b1c9e119a`
- **Domain Names Covered:** `aws.adepukrishnakumar.in`, `api.aws.adepukrishnakumar.in`
- **Status:** `ISSUED` (Valid through April 15, 2027; Amazon Issued RSA-2048)

### 3.3 Application Load Balancer & Listeners
- **Load Balancer ARN:** `arn:aws:elasticloadbalancing:us-east-1:154586926909:loadbalancer/app/aws-apn-staging-alb/d86ab2dd089319ba`
- **Scheme:** `internet-facing`
- **VPC ID:** `vpc-0188cd15cf9543b23`
- **Subnets:** `subnet-0314d56f0137d1929` (us-east-1b), `subnet-0b992fa2d62758d9b` (us-east-1a)
- **Security Group:** `sg-0feb09e572b32b8af` (`aws-apn-staging-alb-sg`, Ports 80 & 443 open to `0.0.0.0/0`)
- **Listeners:**
  1. **HTTPS (Port 443):**
     - **Rule 1 (Priority 10, Host `aws.adepukrishnakumar.in`):** Forwards to Target Group `aws-apn-staging-frontend-tg` (Port 3000).
     - **Default Rule:** Forwards to Target Group `aws-apn-staging-backend-tg` (Port 8000).
  2. **HTTP (Port 80):**
     - Default rule forwards to `aws-apn-staging-backend-tg`.

### 3.4 Target Groups
1. `aws-apn-staging-frontend-tg` (`arn:aws:...:targetgroup/aws-apn-staging-frontend-tg/559aa1f865af0e1d`):
   - Port: 3000 | Type: `ip` | Health Check: `/` (200 OK)
2. `aws-apn-staging-backend-tg` (`arn:aws:...:targetgroup/aws-apn-staging-backend-tg/6ef9bbf507e53b0a`):
   - Port: 8000 | Type: `ip` | Health Check: `/health` (200 OK)

### 3.5 Amazon ECS (Elastic Container Service)
- **Cluster:** `arn:aws:ecs:us-east-1:154586926909:cluster/aws-apn-staging-cluster` (Fargate)
- **Existing Services:**
  - `aws-apn-staging-frontend`: Desired count `0`, Running count `0` (Paused/Drained)
  - `aws-apn-staging-backend`: Desired count `0`, Running count `0` (Paused/Drained)
- **IAM Execution Role:** `arn:aws:iam::154586926909:role/aws-apn-staging-ecs-execution-role`
- **IAM Task Role:** `arn:aws:iam::154586926909:role/aws-apn-staging-backend-task-role`

### 3.6 Amazon ECR (Elastic Container Registry)
- `154586926909.dkr.ecr.us-east-1.amazonaws.com/aws-apn-staging-frontend`
- `154586926909.dkr.ecr.us-east-1.amazonaws.com/aws-apn-staging-backend`

### 3.7 Database (Amazon RDS PostgreSQL)
- **DB Instance Identifier:** `aws-apn-staging`
- **Engine:** PostgreSQL 18.3 | Class: `db.t4g.micro` | Storage: 20 GB gp2 (Encrypted)
- **Status:** `stopped` (Stopped to save costs; auto-restarts Nov 19 if left stopped)
- **Endpoint:** `aws-apn-staging.c4d8m2046cne.us-east-1.rds.amazonaws.com:5432`
- **Security Group:** `sg-088efa14459c754e1` (Ingress on port 5432 from `sg-098cfa41ceba0918a`)
- **Master User:** `postgres` (Managed through Secrets Manager `rds!db-da89f102-cc62-49f1-b3c2-10b9f9ef26ea`)
- **Public Accessibility:** `false` (Private VPC access only)

### 3.8 Authentication (Amazon Cognito)
- **User Pool ID:** `us-east-1_zjzj8nhaA` (`aws-apn-staging-users`)
- **User Pool App Client:** `3l65mmncr1802kgvqb0ji6a1dl` (`aws-apn-staging-web`, USER_PASSWORD_AUTH enabled)

### 3.9 Secrets Manager
- `aws-apn/staging/backend/database-url`: Old SQLAlchemy DATABASE_URL
- `aws-apn/staging/openai-api-key`: OpenAI API key
- `aws-apn/terraform/monitoring-external-id`: External ID
- `rds!db-da89f102-cc62-49f1-b3c2-10b9f9ef26ea`: RDS Master Credentials

### 3.10 CloudWatch Logs
- `/ecs/aws-apn-staging-backend` (30 days retention)
- `/ecs/aws-apn-staging-frontend` (30 days retention)

### 3.11 Terraform State & Management
- State Bucket: `aws-apn-terraform-state-154586926909`
- State Key: `terraform-demo/terraform.tfstate` (Only manages demo EC2 instance `i-073614241740621b6` and security group; the ECS/ALB staging infrastructure was deployed via console or separate automation).

---

## 4. Resource Classification & Reuse Strategy

| Resource | AWS Identifier | Ownership | Classification | Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Route 53 Zone** | `Z05246898LBVAYJXHJB2` | Domain Root | **RETAIN / REUSE** | Reused. Route `aws.adepukrishnakumar.in` remains pointed to the ALB. |
| **ACM Certificate** | `4068708b-f9aa-4f68...` | Domain TLS | **RETAIN / REUSE** | Reused on ALB listener for HTTPS. Zero certificate renewal downtime. |
| **VPC & Subnets** | `vpc-0188cd15cf9543b23` | Shared Network | **RETAIN / REUSE** | Reused. Default VPC with 6 subnets across availability zones. |
| **Application Load Balancer** | `aws-apn-staging-alb` | Load Balancer | **RETAIN / REUSE** | Reused. Eliminates hourly ALB base charge (\$16-22/mo saved). |
| **ALB HTTPS Listener** | Port 443 | ALB Routing | **REUSE (Rule Cutover)** | Add rule pointing to SharkVision target group. Preserve old target group for instant rollback. |
| **ALB Security Group** | `sg-0feb09e572b32b8af` | Network Security | **RETAIN / REUSE** | Reused for inbound 80/443 traffic. |
| **ECS Cluster** | `aws-apn-staging-cluster` | Compute Cluster | **RETAIN / REUSE** | Reused. Fargate cluster charges \$0 at rest; tasks run isolated per service. |
| **ECS Task Execution Role** | `aws-apn-staging-ecs-execution-role` | IAM | **RETAIN / REUSE** | Reused for ECR pull and CloudWatch logging. |
| **RDS PostgreSQL Instance** | `aws-apn-staging` | Shared Database | **REUSE (Separate DB)** | Start instance and provision isolated `sharkvision` DB & user. Retains Cost App tables untouched. |
| **ECR Repository** | `sharkvision` | SharkVision App | **CREATE** | Dedicated repository for SharkVision production container images. |
| **ECS Task Definition** | `sharkvision:1` | SharkVision App | **CREATE** | Next.js standalone task definition (512 CPU, 1024 Memory). |
| **ECS Service** | `sharkvision-service` | SharkVision App | **CREATE** | Dedicated Fargate service deployed into staging target group first. |
| **ALB Target Group** | `sharkvision-tg` | Traffic Routing | **CREATE** | Port 3000 health-checked at `/api/health`. |
| **CloudWatch Log Group** | `/ecs/sharkvision` | Monitoring | **CREATE** | Dedicated log stream with 14-day retention. |
| **Cognito User Pool / Client** | `sharkvision-users` | Auth Identity | **CREATE or MAP** | Dedicated app client with role claims. |
| **Secrets Manager Secret** | `sharkvision/production/env` | Secrets | **CREATE** | Dedicated encrypted secret for `DATABASE_URL`, `APP_SECRET`, Cognito keys. |
| **Old Backend ECS Service** | `aws-apn-staging-backend` | Cost Optimization App | **REMOVE_AFTER_MIGRATION** | Keep stopped at desired count 0 until cutover approved and validated. |
| **Old Frontend ECS Service** | `aws-apn-staging-frontend` | Cost Optimization App | **REMOVE_AFTER_MIGRATION** | Keep stopped at desired count 0 until cutover approved and validated. |

---

## 5. Cost Impact Analysis
- **Reusing existing ALB, VPC, Route 53, and RDS instance:** Saves **\$35.00 - \$45.00 / month** compared to provisioning duplicate ALBs and a second RDS instance.
- **Estimated Net Cost for SharkVision on ECS Fargate (0.5 vCPU, 1 GB RAM):** ~\$11.00 / month for compute.
