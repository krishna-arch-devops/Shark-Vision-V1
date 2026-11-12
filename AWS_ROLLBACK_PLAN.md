# SharkVision Emergency Rollback Plan

**Document:** AWS_ROLLBACK_PLAN.md  
**Target Domain:** `https://aws.adepukrishnakumar.in/`  
**Previous Target Group:** `aws-apn-staging-frontend-tg` (`arn:aws:elasticloadbalancing:us-east-1:154586926909:targetgroup/aws-apn-staging-frontend-tg/559aa1f865af0e1d`)  
**New Target Group:** `sharkvision-tg`  
**Target Recovery Time Objective (RTO):** < 60 seconds  
**Target Recovery Point Objective (RPO):** 0 (No data loss)  

---

## 1. Rollback Triggers

An immediate emergency rollback must be initiated if any of the following conditions occur within 30 minutes following domain cutover:

1. **Service Unavailability:** HTTP 502/503/504 error rate on `aws.adepukrishnakumar.in` exceeds 1% over a 2-minute rolling window.
2. **Container Crashloop:** SharkVision Fargate tasks repeatedly crash or fail health checks (`/api/health`).
3. **Database Connectivity Breakdown:** SharkVision container cannot maintain connection pools to PostgreSQL RDS.
4. **Authentication Failure:** Complete failure of user authentication or session creation preventing portal access.
5. **Critical Data Anomaly:** Corruption or failure in examination submission or analytics computation.

---

## 2. Emergency 60-Second Rollback Procedure

### Step 1: Revert ALB Listener Rule Traffic (Instantaneous Cutback)

Execute the following AWS CLI command to immediately switch listener rule priority 10 back to the previous target group:

```bash
aws elbv2 modify-listener-rule \
  --rule-arn arn:aws:elasticloadbalancing:us-east-1:154586926909:listener-rule/app/aws-apn-staging-alb/d86ab2dd089319ba/61f68fcd83149d57/<RULE_ID> \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:154586926909:targetgroup/aws-apn-staging-frontend-tg/559aa1f865af0e1d
```

*(If priority 5 rule was created for SharkVision, simply delete or disable priority 5 rule so traffic immediately cascades back to rule 10):*
```bash
aws elbv2 delete-rule \
  --rule-arn <PRIORITY_5_RULE_ARN>
```

### Step 2: Verify Routing Restoration
Verify that traffic to `https://aws.adepukrishnakumar.in` is no longer routed to `sharkvision-tg`:
```bash
curl -Iv https://aws.adepukrishnakumar.in/
```

---

## 3. Post-Rollback Application State & Containment

### 3.1 Preserve Logs & Forensics
Do **NOT** destroy the `sharkvision-service` or delete CloudWatch log streams immediately. Keep the service isolated to inspect logs:
```bash
# Capture ECS task logs
aws logs filter-log-events \
  --log-group-name /ecs/sharkvision \
  --start-time $(date -u -d '30 minutes ago' +%s000) \
  > rollback_diagnostics.log
```

### 3.2 Database State
- Because SharkVision utilizes an isolated database (`sharkvision`), the Cost Optimization database and tables were completely untouched throughout the deployment.
- No rollback or point-in-time recovery is required on the Cost Optimization tables.
- The `sharkvision` database can be safely inspected or reset without any risk to the existing legacy platform.

### 3.3 Scale Down SharkVision (Optional)
Once forensic logs have been collected, scale SharkVision tasks to 0 to prevent compute billing:
```bash
aws ecs update-service \
  --cluster aws-apn-staging-cluster \
  --service sharkvision-service \
  --desired-count 0
```

---

## 4. Rollback Verification Checklist

- [ ] Public traffic on `https://aws.adepukrishnakumar.in` no longer reaches `sharkvision-tg`.
- [ ] ALB metrics confirm 0 new requests forwarded to SharkVision.
- [ ] CloudWatch logs from the failure window have been exported for analysis.
- [ ] Incident notification sent to engineering stakeholders.
- [ ] Post-mortem issue logged with full tracebacks and remediation action items.
