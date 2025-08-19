# Design Sheet

## Product Pillars
1. Accuracy & Integrity
2. Speed & Efficiency
3. Insight & Actionability
4. Transparency & Auditability
5. Accessibility & Inclusivity (EN/AR, WCAG 2.1 AA)

## User Roles & Primary Tasks
| Role | Primary Needs |
|------|---------------|
| Mystery Shopper | Submit visits quickly, mobile-friendly, guidance |
| QA Analyst | Validate submissions, flag anomalies |
| Program Manager | Configure templates, monitor KPIs, escalate |
| Regulator Viewer | Read-only oversight, export reports |
| System Admin | Manage users, roles, system settings |

## Core Use Cases (MVP)
- Capture standardized submission (with validation) ✅
- View aggregate metrics ✅
- Manage question bank (Phase 1)
- Role-based access (Phase 1)
- Alerts on low scores (Phase 1)

## Non-Functional Requirements
- Availability: 99.5% (Phase 1)
- Response < 300ms p95 for core API
- Data retention: 7 years
- Encryption: TLS in transit, AES-256 at rest
- Audit logging for create/update/delete

## Scoring Engine Concept
Weighted composite = Σ(question_score * question_weight * channel_weight) / Σ(question_weight * channel_weight)

## Data Quality Controls
- Allowed score range per question
- Mandatory fields per channel template
- Duplicate detection (same shopper + location + datetime window)

## Tech Choices
- Backend: FastAPI (Python) -> mature ecosystem, async
- DB: PostgreSQL (JSONB for flexible metadata)
- Queue: Redis / RQ (later Celery)
- Auth: OAuth2 / OIDC (Azure AD B2C / UAE Pass)
- Infra: Containerized (AKS / ECS), IaC (Terraform)
- Observability: OpenTelemetry, Prometheus, Grafana

## Future ML Enhancements
- Outlier detection of scoring patterns
- NLP sentiment on comments
- Predictive alerting for downward trends

