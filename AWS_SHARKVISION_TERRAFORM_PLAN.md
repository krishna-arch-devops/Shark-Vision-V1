# SharkVision Terraform Infrastructure Plan

**Document:** AWS_SHARKVISION_TERRAFORM_PLAN.md  
**AWS Account:** `154586926909` (us-east-1)  
**State Storage:** S3 Bucket `aws-apn-terraform-state-154586926909` (Key: `sharkvision/terraform.tfstate`)  
**Deployment Model:** Infrastructure as Code (IaC) integrating existing VPC/ALB with dedicated SharkVision resources  

---

## 1. Architecture & Strategy

To avoid disrupting the existing AWS Cost Optimization application (`aws-apn-staging`) while maintaining strict infrastructure reproducibility and cost minimization, Terraform will:

1. **Import / Reference via Data Sources** shared foundation resources:
   - AWS VPC (`vpc-0188cd15cf9543b23`) and its public/private subnets.
   - Application Load Balancer (`aws-apn-staging-alb`).
   - HTTPS Listener on port 443 (`arn:aws:...:listener/app/aws-apn-staging-alb/.../61f68fcd83149d57`).
   - ACM Certificate (`4068708b-f9aa-4f68-9403-ef5b1c9e119a`).
   - ECS Cluster (`aws-apn-staging-cluster`).
   - Existing RDS PostgreSQL instance (`aws-apn-staging`).

2. **Manage as Native Terraform Resources** all SharkVision-specific resources:
   - ECR Repository: `sharkvision`
   - CloudWatch Log Group: `/ecs/sharkvision`
   - ALB Target Group: `sharkvision-tg`
   - ECS Task Definition: `sharkvision`
   - ECS Service: `sharkvision-service`
   - Secrets Manager Secret: `sharkvision/production/config`
   - Security Group for SharkVision ECS Tasks: `sharkvision-ecs-sg`

---

## 2. Directory Structure

```
terraform/
├── main.tf              # Provider configuration and S3 backend
├── data.tf              # Data sources referencing existing AWS infrastructure
├── ecr.tf               # Dedicated ECR repository with image scanning & lifecycle policy
├── logs.tf              # CloudWatch log group with 14-day retention
├── security.tf          # ECS task security group allowing port 3000 from ALB
├── target_group.tf      # Target group for SharkVision port 3000 with /api/health
├── secrets.tf           # Secrets Manager secret definition
├── ecs.tf               # Fargate Task Definition and ECS Service
├── outputs.tf           # Target group ARN, Service name, ECR URI outputs
└── variables.tf         # Configurable parameters (CPU, Memory, Image tag, etc.)
```

---

## 3. Terraform Code Specifications

### 3.1 Backend & Providers (`main.tf`)
```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "aws-apn-terraform-state-154586926909"
    key            = "sharkvision/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "SharkVision"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}
```

### 3.2 Data Sources (`data.tf`)
```hcl
data "aws_vpc" "existing" {
  id = "vpc-0188cd15cf9543b23"
}

data "aws_subnets" "existing_public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing.id]
  }
  filter {
    name   = "subnet-id"
    values = ["subnet-0314d56f0137d1929", "subnet-0b992fa2d62758d9b"]
  }
}

data "aws_lb" "existing" {
  arn = "arn:aws:elasticloadbalancing:us-east-1:154586926909:loadbalancer/app/aws-apn-staging-alb/d86ab2dd089319ba"
}

data "aws_lb_listener" "https" {
  load_balancer_arn = data.aws_lb.existing.arn
  port              = 443
}

data "aws_ecs_cluster" "existing" {
  cluster_name = "aws-apn-staging-cluster"
}

data "aws_security_group" "alb_sg" {
  id = "sg-0feb09e572b32b8af"
}

data "aws_iam_role" "ecs_execution" {
  name = "aws-apn-staging-ecs-execution-role"
}

data "aws_iam_role" "ecs_task" {
  name = "aws-apn-staging-backend-task-role"
}

data "aws_db_instance" "existing_rds" {
  db_instance_identifier = "aws-apn-staging"
}
```

### 3.3 Target Group & Health Check (`target_group.tf`)
```hcl
resource "aws_lb_target_group" "sharkvision" {
  name                 = "sharkvision-tg"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = data.aws_vpc.existing.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/api/health"
    port                = "3000"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }

  tags = {
    Name = "sharkvision-tg"
  }
}
```

### 3.4 ECR & CloudWatch (`ecr.tf`, `logs.tf`)
```hcl
resource "aws_ecr_repository" "sharkvision" {
  name                 = "sharkvision"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "sharkvision" {
  repository = aws_ecr_repository.sharkvision.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 production images"
        selection = {
          tagStatus   = "any"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "sharkvision" {
  name              = "/ecs/sharkvision"
  retention_in_days = 14
}
```

### 3.5 Security Group (`security.tf`)
```hcl
resource "aws_security_group" "sharkvision_ecs" {
  name        = "sharkvision-ecs-sg"
  description = "Security group for SharkVision ECS Fargate tasks"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description     = "Allow HTTP port 3000 from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [data.aws_security_group.alb_sg.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sharkvision-ecs-sg"
  }
}
```

### 3.6 ECS Task Definition & Service (`ecs.tf`)
```hcl
resource "aws_ecs_task_definition" "sharkvision" {
  family                   = "sharkvision"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"  # 0.5 vCPU
  memory                   = "1024" # 1024 MB RAM
  execution_role_arn       = data.aws_iam_role.ecs_execution.arn
  task_role_arn            = data.aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "sharkvision-web"
      image     = "${aws_ecr_repository.sharkvision.repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "HOSTNAME", value = "0.0.0.0" },
        { name = "NEXT_PUBLIC_APP_NAME", value = "SHARKVISION" }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.sharkvision.arn}:DATABASE_URL::"
        },
        {
          name      = "APP_SECRET"
          valueFrom = "${aws_secretsmanager_secret.sharkvision.arn}:APP_SECRET::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.sharkvision.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "web"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --spider -q http://localhost:3000/api/health || exit 1"]
        interval    = 15
        timeout     = 5
        retries     = 3
        startPeriod = 20
      }
    }
  ])
}

resource "aws_ecs_service" "sharkvision" {
  name            = "sharkvision-service"
  cluster         = data.aws_ecs_cluster.existing.id
  task_definition = aws_ecs_task_definition.sharkvision.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.existing_public.ids
    security_groups  = [aws_security_group.sharkvision_ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.sharkvision.arn
    container_name   = "sharkvision-web"
    container_port   = 3000
  }

  depends_on = [
    aws_lb_target_group.sharkvision
  ]
}
```

---

## 4. Execution Workflow

1. **Initialization:**
   ```bash
   terraform init -reconfigure
   ```
2. **Review Execution Plan:**
   ```bash
   terraform plan -out=tfplan
   ```
   *Inspect to verify 0 resources destroyed, only newly managed SharkVision resources to be created.*
3. **Application:**
   ```bash
   terraform apply tfplan
   ```
4. **Health Check Inspection:**
   Verify `sharkvision-tg` reaches `healthy` state in AWS Console / CLI before proceeding to domain cutover.
