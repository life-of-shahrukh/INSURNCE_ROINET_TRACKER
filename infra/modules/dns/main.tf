# ── Route 53 hosted zone ──────────────────────────────────────────────────────
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = var.domain_name
  }
}

# ── ACM certificate (apex + wildcard SAN) ─────────────────────────────────────
# One cert covers insuranceroinet.xyz AND *.insuranceroinet.xyz (api., www., …)
resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = var.domain_name
  }
}

# ── DNS records that ACM uses to prove domain ownership ───────────────────────
# The apex (insuranceroinet.xyz) and wildcard (*.insuranceroinet.xyz) SANs share
# ONE CNAME record. Grouping with "..." deduplicates them; [0] picks the first.
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options :
    dvo.resource_record_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }...
  }

  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value[0].name
  type            = each.value[0].type
  ttl             = 60
  records         = [each.value[0].record]
  allow_overwrite = true
}

# Waits until ACM marks the certificate as ISSUED
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = values(aws_route53_record.cert_validation)[*].fqdn
}
