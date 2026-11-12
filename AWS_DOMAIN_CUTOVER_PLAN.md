# SharkVision Domain Cutover Plan: `aws.adepukrishnakumar.in`

**Document:** AWS_DOMAIN_CUTOVER_PLAN.md  
**Target Domain:** `https://aws.adepukrishnakumar.in/`  
**Load Balancer:** `aws-apn-staging-alb` (`arn:aws:elasticloadbalancing:us-east-1:154586926909:loadbalancer/app/aws-apn-staging-alb/d86ab2dd089319ba`)  
**HTTPS Listener (443):** `arn:aws:elasticloadbalancing:us-east-1:154586926909:listener/app/aws-apn-staging-alb/d86ab2dd089319ba/61f68fcd83149d57`  
**Current Routing:** Priority 10 rule forwards `aws.adepukrishnakumar.in` to `aws-apn-staging-frontend-tg`  
**Objective:** Seamless, zero-downtime cutover to `sharkvision-tg` with instant rollback readiness.

---

## 1. Cutover Overview & Safety Guarantees

| Parameter | Specification |
| :--- | :--- |
| **Downtime Window** | **0 seconds** (Instantaneous atomic switch at ALB listener rule layer) |
| **DNS Propagation Delay** | **0 seconds** (DNS record `aws.adepukrishnakumar.in` ALIAS to ALB remains unchanged) |
| **Rollback Time (RTO)** | **< 30 seconds** (Single CLI command restores listener rule to old target group) |
| **Prerequisites** | SharkVision Fargate container in `RUNNING` state; `sharkvision-tg` target in `healthy` state |

---

## 2. Pre-Cutover Verification Gate (Must Pass 100%)

Before executing the traffic switch, the following verification gates must be validated:

### Gate 1: Database Health & Migrations
```bash
# Verify RDS instance is available
aws rds describe-db-instances \
  --db-instance-identifier aws-apn-staging \
  --query "DBInstances[0].DBInstanceStatus" \
  --output text
# Expected: available

# Verify sharkvision database connectivity & tables
# Executed via migration runner or connection test script
```

### Gate 2: ECS Service & Task Health
```bash
# Check ECS task running status
aws ecs list-tasks \
  --cluster aws-apn-staging-cluster \
  --service-name sharkvision-service

# Inspect task container health check
aws ecs describe-tasks \
  --cluster aws-apn-staging-cluster \
  --tasks <TASK_ARN> \
  --query "tasks[0].containers[0].healthStatus"
# Expected: HEALTHY
```

### Gate 3: Target Group Health
```bash
# Query target group health status
aws elbv2 describe-target-health \
  --target-group-arn <SHARKVISION_TG_ARN>
# Expected output: TargetHealth.State == "healthy"
```

### Gate 4: Internal Smoke Test
Before opening public traffic, send a test request to the private IP of the task container or stage a temporary test path rule on the ALB:
- Verify `/api/health` returns `{"status":"ok"}` with HTTP 200.
- Verify Next.js renders login HTML.

---

## 3. Atomic Cutover Execution

The existing ALB Listener Rule for `aws.adepukrishnakumar.in` is:
- **Rule ARN:** `arn:aws:elasticloadbalancing:us-east-1:154586926909:listener-rule/app/aws-apn-staging-alb/d86ab2dd089319ba/61f68fcd83149d57/<RULE_ID>`
- **Priority:** `10`
- **Host Header:** `aws.adepukrishnakumar.in`

### Execution Command:
```bash
aws elbv2 modify-listener-rule \
  --rule-arn <RULE_10_ARN> \
  --actions Type=forward,TargetGroupArn=<SHARKVISION_TG_ARN>
```

*Note: Alternatively, if creating a new rule with priority 5 for `aws.adepukrishnakumar.in`, traffic will immediately follow priority 5, leaving rule 10 as an intact fallback.*

---

## 4. Post-Cutover Verification Protocol

Execute immediately after running the cutover command:

| Step | Test Description | Command / Method | Expected Result |
| :--- | :--- | :--- | :--- |
| **4.1** | TLS Certificate Verification | `curl -Iv https://aws.adepukrishnakumar.in/api/health` | HTTP 200 OK, ACM SSL cert valid |
| **4.2** | Application Landing Page | Open `https://aws.adepukrishnakumar.in/` | SharkVision Portal / Sign In displays |
| **4.3** | Student Demo Authentication | Sign in with demo student credentials | Redirect to `/student/dashboard` |
| **4.4** | Executive Demo Assessment | Open Demo Exam, take 5 questions, navigate | Answer selection, review flag, timer works |
| **4.5** | Assessment Submission | Submit exam and view results | Instant analytics calculation & results page |
| **4.6** | Question Explorer & Redirection | Click incorrect question in Question Explorer | Opens question with red/green answer highlights |
| **4.7** | CloudWatch Metrics & Logs | Inspect `/ecs/sharkvision` stream | No unhandled exceptions or 500 errors |

---

## 5. Cutover Sign-Off Criteria

The cutover is marked **COMPLETE & SUCCESSFUL** when:
1. HTTP 200 responses consistently logged on `/` and `/api/health`.
2. Error rate (4xx/5xx) on ALB is 0.00%.
3. Full student examination flow executes end-to-end without disruption.
4. Release Manager & Tech Lead approve the deployment status.
