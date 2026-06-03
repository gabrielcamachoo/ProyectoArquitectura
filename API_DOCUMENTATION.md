# API Documentation

**Adaptive Learning Platform — PUJ AS 2026**

## Architecture Overview

This platform implements a microservices architecture with 8 Node.js services deployed via Docker Compose (dev) and Terraform AWS (prod).

### Services

| Service | Port | Purpose | Authentication |
|---------|------|---------|-----------------|
| **auth-service** | 3000 | JWT RS256 auth, RBAC, Ley 1581 compliance | Public (except logout, data endpoints) |
| **course-service** | 3001 | Course, module, material CRUD | Bearer JWT required |
| **assessment-service** | 3002 | Evaluations, attempts, grading | Bearer JWT required |
| **adaptive-service** | 3003 | Recommendation engine, RabbitMQ consumer | Bearer JWT required |
| **progress-service** | 3004 | Student progress aggregation | Bearer JWT required |
| **collaboration-service** | 3005 | Forums, study groups, tutoring | Bearer JWT required |
| **analytics-service** | 3006 | CQRS dashboard, read-replica queries | Bearer JWT required |
| **notification-service** | 3007 | Multi-channel notifications | Bearer JWT required |

### Technology Stack

**Frontend:**
- React 19, TypeScript, Vite, React Router v7
- Port: 5173

**Backend:**
- Node.js 18+, Express.js, TypeORM
- PostgreSQL 16 (primary + read-replica)
- Redis 7 (token blacklist, recommendations cache, refresh tokens)
- RabbitMQ 3.13 (async event publishing)

**API Gateway & Security:**
- Kong 3.7: JWT validation, RBAC enforcement, rate limiting (100 req/min)
- RS256 algorithm for JWT signing

## Authentication & Authorization

### JWT Tokens

```json
{
  "iss": "auth-jwt-key",
  "sub": "user-id",
  "role": "student|teacher|admin",
  "iat": 1234567890,
  "exp": 1234571490  // 1 hour for access token
}
```

- **Access Token:** 1 hour expiry
- **Refresh Token:** 7 day expiry, stored in Redis
- **Algorithm:** RS256 (asymmetric)

### Token Flow

1. **Register** → POST `/auth/register` → User created
2. **Login** → POST `/auth/login` → Returns `{ accessToken, refreshToken, expiresIn }`
3. **Use** → Include `Authorization: Bearer <accessToken>` in requests
4. **Refresh** → POST `/auth/refresh` with `refreshToken` → New `accessToken`
5. **Logout** → POST `/auth/logout` → Token added to Redis blacklist

### RBAC (Role-Based Access Control)

| Role | Permissions |
|------|-------------|
| **student** | View own data, submit evaluations, participate in forums |
| **teacher** | Create/edit courses, grade evaluations, view class analytics |
| **admin** | Full access to all resources |

Routes are protected with:
- `authGuard`: Validates JWT, extracts userId and role
- `requireRole(roles)`: Checks if user.role in allowed roles
- `requireSelfOrRole(roles)`: Allows self-access or specific roles

## Data Layer

### Hybrid Persistence

All services support **two storage modes:**

1. **PostgreSQL Mode** (Default when available)
   - Uses PostgreSQL for full persistence (ACID, indexes)
   - Can be configured via `DATABASE_URL`

2. **In-Memory Mode** (Automatic fallback)
   - Used when PostgreSQL is not available at runtime
   - Keeps data for the lifetime of the process (no persistence across restarts)

For local classroom/demo usage, **auth-service** auto-detects PostgreSQL without requiring manual `DATABASE_URL` configuration.

### Database Schema

**auth-service:**
- `users`: User accounts with encrypted PII (fullName, institutionalEmail)
- `roles`: Student, teacher, admin
- `permissions`: Role-resource-action mappings

**course-service:**
- `courses`: Course metadata with teacher FK
- `modules`: Course modules with order and status
- `materials`: Course materials with type and visibility

**assessment-service:**
- `evaluations`: Quiz/exam definitions with weight and deadline
- `attempts`: Student attempt records with status and score

**progress-service:**
- `progress_records`: Student progress by course/module with unique constraint

**collaboration-service:**
- `forums`: Course forums with moderator
- `forum_posts`: Forum posts with author
- `study_groups`: Study group definitions
- `tutoring_sessions`: Tutoring session bookings

**notification-service:**
- `notifications`: User notifications with JSONB content

**analytics-service:**
- Views: `v_course_analytics`, `v_student_progress`, `v_at_risk_students`
- Queries read from `DATABASE_READ_URL` (read-replica) if set

### Data Protection (Ley 1581)

The platform complies with Colombian data protection regulations (Ley 1581, similar to GDPR):

- **PII Encryption:** `fullName`, `institutionalEmail` stored as BYTEA encrypted columns
- **Data Export:** GET `/users/{id}/data` → Exports all user data in standard format
- **Right to Be Forgotten:** DELETE `/users/{id}` → Soft-deletes user and anonymizes records
- **GDPR-like Compliance:** Explicit consent, purpose limitation, data minimization

## Critical Flows

### 1. Student Evaluation Flow

```
1. Teacher creates evaluation        → POST /evaluations
2. Student starts attempt            → POST /evaluations/{id}/attempts
3. Student submits attempt           → PUT /attempts/{id}/submit
4. Teacher grades attempt            → PUT /attempts/{id}/grade (HTTP 200 in <2s)
5. Event published async             → "evaluacion.completada.v1" to RabbitMQ
6. Adaptive service receives event   → Consumes and processes recommendation
7. Recommendation cached in Redis    → TTL 5 minutes
8. Frontend fetches recommendation   → GET /recommendations/student/{id}
9. Student receives feedback         → Displayed in UI
```

**Key Requirement:** Step 4 returns HTTP 200 immediately without waiting for RabbitMQ (P95 <2s).

### 2. Recommendation Engine

When evaluation is graded, adaptive-service computes recommendations based on score:

| Score | Recommendation | Scope |
|-------|-----------------|-------|
| < 60% | **Refuerzo** (reinforcement) | Current published module |
| 60-80% | **Profundización** (depth) | Next modules in course |
| > 80% | **Recurso complementario** (enrichment) | Related courses |

### 3. Analytics Dashboard (CQRS)

- **Write:** Queries against primary PostgreSQL
- **Read:** Queries against read-replica via `DATABASE_READ_URL`
- **Aggregation:** Computed metrics (completion_rate, avg_score, at_risk_students)
- **Fallback:** Demo data if query fails

## Error Handling

### Standard Error Response

```json
{
  "error": "error_code",
  "message": "Human readable message"
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `invalid_credentials` | 401 | Login failed |
| `unauthorized` | 401 | Missing or invalid token |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `user_exists` | 409 | User already registered |
| `invalid_state` | 409 | Resource in wrong state |
| `server_error` | 500 | Internal server error |

## Rate Limiting

Kong enforces **100 requests per minute** per IP address globally across all services.

## Circuit Breaker Pattern

**adaptive-service** implements Opossum circuit breaker:
- **Error Threshold:** 50% of requests fail
- **Reset Timeout:** 30 seconds
- **Fallback:** Generic "recurso_complementario" recommendation

If circuit breaks, recommendations still returned to prevent platform downtime.

## Redis Usage

| Key | Purpose | TTL |
|-----|---------|-----|
| `token-blacklist:{token}` | Logout token invalidation | Token expiry time |
| `recommendations:{studentId}` | Cached recommendations | 5 minutes |
| `dashboard:{courseId}` | Cached analytics metrics | 5 minutes |
| `refresh-token:{token}` | Active refresh tokens | 7 days |

## Environment Variables

### All Services

```bash
DATABASE_URL=postgres://user:password@postgres:5432/academic
DATABASE_READ_URL=postgres://user:password@read-replica:5432/academic  # optional
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
NODE_ENV=development
PORT=3000  # service-specific
```

### Auth Service

```bash
JWT_PRIVATE_KEY=<base64-encoded-private-key>
JWT_PUBLIC_KEY=<base64-encoded-public-key>
JWT_ISSUER=auth-jwt-key
```

### Kong

```bash
KONG_DATABASE=postgres
KONG_PG_HOST=postgres
KONG_ADMIN_ACCESS_LOG=-
KONG_ADMIN_ERROR_LOG=-
```

## Swagger UI Access

Each service exposes OpenAPI documentation at `/docs`:

- http://localhost:3000/docs — Auth Service
- http://localhost:3001/docs — Course Service
- http://localhost:3002/docs — Assessment Service
- http://localhost:3003/docs — Adaptive Service
- http://localhost:3004/docs — Progress Service
- http://localhost:3005/docs — Collaboration Service
- http://localhost:3006/docs — Analytics Service
- http://localhost:3007/docs — Notification Service

## Testing API Requests

### Example: Register & Login

```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "institutionalEmail": "student@javeriana.edu.co",
    "password": "SecurePass123!",
    "fullName": "Juan Pérez"
  }'

# Response
{
  "id": "uuid",
  "institutionalEmail": "student@javeriana.edu.co",
  "role": "student",
  "createdAt": "2026-05-31T10:00:00Z"
}

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "institutionalEmail": "student@javeriana.edu.co",
    "password": "SecurePass123!"
  }'

# Response
{
  "id": "uuid",
  "institutionalEmail": "student@javeriana.edu.co",
  "role": "student",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600
}

# 3. Use Token
curl -X GET http://localhost:3001/courses \
  -H "Authorization: Bearer eyJhbGc..."

# Response
{
  "items": [
    {
      "id": "uuid",
      "name": "Arquitectura de Microservicios",
      "description": "...",
      "status": "published"
    }
  ]
}
```

## Deployment

### Development (Docker Compose)

```bash
docker-compose up
```

Starts all services with in-memory storage (unless DATABASE_URL set).

### Production (Terraform + AWS)

```bash
cd terraform/
terraform apply
```

Provisions:
- RDS PostgreSQL 16 (primary + read-replica)
- ElastiCache Redis 7
- RDS Aurora for high availability
- ECS Fargate for container orchestration
- Application Load Balancer
- CloudWatch monitoring

## Support

For issues or questions:
- Email: support@puj-as.edu
- Documentation: [OpenAPI Specs](#services)
- GitHub: [Repository URL]
