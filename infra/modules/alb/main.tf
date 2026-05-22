resource "aws_alb" "main" {
  name               = "${var.project}-${var.env}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.env == "prod"

  tags = {
    Name        = "${var.project}-${var.env}-alb"
    Project     = var.project
    Environment = var.env
  }
}

# ── Target groups ─────────────────────────────────────────────────────────────
resource "aws_alb_target_group" "app" {
  name        = "${var.project}-${var.env}-app-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }

  tags = {
    Project     = var.project
    Environment = var.env
  }
}

resource "aws_alb_target_group" "server" {
  name        = "${var.project}-${var.env}-api-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200-299"
  }

  tags = {
    Project     = var.project
    Environment = var.env
  }
}

# ── HTTP listener — redirect to HTTPS or forward if no cert ──────────────────
resource "aws_alb_listener" "http" {
  load_balancer_arn = aws_alb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    dynamic "forward" {
      for_each = var.certificate_arn == "" ? [1] : []
      content {
        target_group {
          arn = aws_alb_target_group.app.arn
        }
      }
    }
  }
}

# ── HTTPS listener (conditional) ─────────────────────────────────────────────
resource "aws_alb_listener" "https" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_alb.main.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = var.certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.app.arn
  }
}

# Route /api/* → NestJS server target group
resource "aws_alb_listener_rule" "api" {
  count        = var.certificate_arn != "" ? 1 : 0
  listener_arn = aws_alb_listener.https[0].arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.server.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

resource "aws_alb_listener_rule" "api_http" {
  count        = var.certificate_arn == "" ? 1 : 0
  listener_arn = aws_alb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.server.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
