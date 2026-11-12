# AWS Legacy Application Cleanup Plan

**Document:** AWS_OLD_APPLICATION_CLEANUP.md  
**Legacy Application:** AWS Cost Optimization Platform (`aws-apn-staging`)  
**New Active Application:** SharkVision Examination Platform  
**Target Domain:** `https://aws.adepukrishnakumar.in/`  

---

## 1. Safety Principles & Quarantine Strategy

To prevent accidental data loss or disruption to shared infrastructure:

> [!CAUTION]
> **DO NOT** delete any legacy resources on day 1 of migration.
> Enforce a **7 to 14-day quarantine period** post-cutover during which all legacy resources remain intact, paused, and readily restorable if needed.

### Resource Boundary Protection
- **Shared Infrastructure (NEVER DELETE):**
  - Route 53 Hosted Zone: `adepukrishnakumar.in` (`Z05246898LBVAYJXHJB2`)
  - ACM Certificate: `arn:aws:acm:us-east-1:154586926909:certificate/4068708b-f9aa-4f68-9403-ef5b1c9e119a`
  - Application Load Balancer: `aws-apn-staging-alb` (`d86ab2dd089319ba`)
  - ALB Security Group: `sg-0feb09e572b32b8af`
  - VPC & Subnets: `vpc-0188cd15cf9543b23`
  - ECS Fargate Cluster: `aws-apn-staging-cluster`
  - RDS DB Instance: `aws-apn-staging` (SharkVision runs in a separate logical database `sharkvision` on this instance)

---

## 2. Legacy Resource Inventory & Cost Profile

| Resource Type | AWS Resource Identifier | Quarantine State | Running Cost in Quarantine | Cleanup Action (Post-Quarantine) |
| :--- | :--- | :--- | :--- | :--- |
| **ECS Service** | `aws-apn-staging-frontend` | Desired Count: 0 | \$0.00 / mo | Delete Service |
| **ECS Service** | `aws-apn-staging-backend` | Desired Count: 0 | \$0.00 / mo | Delete Service |
| **ALB Target Group** | `aws-apn-staging-frontend-tg` | 0 registered targets | \$0.00 / mo | Deregister & Delete |
| **ALB Target Group** | `aws-apn-staging-backend-tg` | 0 registered targets | \$0.00 / mo | Deregister & Delete |
| **ECR Repository** | `aws-apn-staging-frontend` | Inactive | Minimal storage (< \$0.50/mo) | Retain snapshot / Delete |
| **ECR Repository** | `aws-apn-staging-backend` | Inactive | Minimal storage (< \$0.50/mo) | Retain snapshot / Delete |
| **CloudWatch Logs** | `/ecs/aws-apn-staging-frontend` | Retained (30-day policy) | < \$0.20 / mo | Allow auto-expiration |
| **CloudWatch Logs** | `/ecs/aws-apn-staging-backend` | Retained (30-day policy) | < \$0.20 / mo | Allow auto-expiration |
| **Secrets Manager** | `aws-apn/staging/backend/database-url` | Retained | \$0.40 / mo | Delete secret (with 30-day recovery window) |
| **Secrets Manager** | `aws-apn/staging/openai-api-key` | Retained | \$0.40 / mo | Delete secret (with 30-day recovery window) |
| **RDS Legacy DB** | `postgres` default database tables | Preserved in RDS | \$0.00 extra | Retain or dump backup to S3 |

---

## 3. Post-Quarantine Decommission Procedure (Day 14+)

Once SharkVision has operated stably in production for at least 14 days and business sign-off is granted, decommission proceeds in the following safe, ordered phases:

### Phase 1: Delete Paused ECS Services
```bash
aws ecs delete-service \
  --cluster aws-apn-staging-cluster \
  --service aws-apn-staging-frontend \
  --force

aws ecs delete-service \
  --cluster aws-apn-staging-cluster \
  --service aws-apn-staging-backend \
  --force
```

### Phase 2: Deregister Task Definitions
```bash
# Deregister active revisions of legacy task definitions
aws ecs deregister-task-definition \
  --task-definition aws-apn-staging-frontend:<REVISION>

aws ecs deregister-task-definition \
  --task-definition aws-apn-staging-backend:<REVISION>
```

### Phase 3: Remove ALB Target Groups
*(Only execute after verifying listener rule 10 and default actions point solely to `sharkvision-tg`)*
```bash
aws elbv2 delete-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:154586926909:targetgroup/aws-apn-staging-frontend-tg/559aa1f865af0e1d

aws elbv2 delete-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:154586926909:targetgroup/aws-apn-staging-backend-tg/6ef9bbf507e53b0a
```

### Phase 4: Deprecate ECR Repositories
```bash
aws ecr delete-repository \
  --repository-name aws-apn-staging-frontend \
  --force

aws ecr delete-repository \
  --repository-name aws-apn-staging-backend \
  --force
```

### Phase 5: Soft Delete Secrets Manager Secrets (With Recovery Window)
```bash
aws secretsmanager delete-secret \
  --secret-id aws-apn/staging/backend/database-url \
  --recovery-window-in-days 30

aws secretsmanager delete-secret \
  --secret-id aws-apn/staging/openai-api-key \
  --recovery-window-in-days 30
```

---

## 4. Decommission Checklist & Verification

- [ ] Quarantine period (minimum 14 days) completed without incident.
- [ ] Stakeholder approval received for legacy retirement.
- [ ] RDS backup snapshot taken before touching any database schemas.
- [ ] Legacy ECS services removed.
- [ ] Legacy ALB target groups removed.
- [ ] No routing dependencies remain pointing to legacy targets.
- [ ] Monthly AWS bill audited to confirm complete cleanup of obsolete charges.
