# ✅ RF-01 COMPLETADO - Auth Service (JWT RS256 + RBAC + Ley 1581)

**Fecha**: 31 Mayo 2026  
**Estado**: ✅ LISTO PARA TESTING  
**Próximo**: RF-02 Course Service CRUD

---

## 📋 LO QUE SE IMPLEMENTÓ

### 1️⃣ **Entities TypeORM (Corregidas + Actualizadas)**

#### ✅ User Entity (`domain/entities/User.ts`)
```typescript
- @PrimaryGeneratedColumn('uuid') id: string
- @Column { type: 'bytea' } fullName (encriptado)
- @Column { type: 'bytea' } institutionalEmail (encriptado)
- @Column { type: 'text' } passwordHash (bcrypt)
- @Column 'uuid' roleId (relación a Role)
- @Column varchar(30) status: 'active' | 'inactive'
- @Column boolean consentAccepted (Ley 1581)
- @Column timestamp consentAcceptedAt (Ley 1581 audit)
- @ManyToOne Role
- @Index unique en institutionalEmail
```

#### ✅ Role Entity (`domain/entities/Role.ts`)
```typescript
- @PrimaryGeneratedColumn('uuid') id
- @Column varchar(50, unique) name: 'student' | 'teacher' | 'admin'
- @Column text description (nullable)
- @OneToMany Permission[] cascade
- @OneToMany User[]
- Timestamp audit fields (createdAt, updatedAt, createdBy, updatedBy)
```

#### ✅ Permission Entity (`domain/entities/Permission.ts`)
```typescript
- @PrimaryGeneratedColumn('uuid') id
- @Column roleId (FK to Role)
- @Column varchar(80) action: 'read' | 'create' | 'update' | 'delete'
- @Column varchar(120) resource: 'courses' | 'evaluations' | etc
- @Index unique(roleId, action, resource)
- @ManyToOne Role onDelete: CASCADE
```

---

### 2️⃣ **TypeORM DataSource + Repositories**

#### ✅ DataSource Configurado (`repositories/dataSource.ts`)
```typescript
- type: 'postgres'
- url: process.env.DATABASE_URL
- entities: [UserEntity, RoleEntity, PermissionEntity]
- SSL para producción
- Logging condicional (dev vs prod)
```

#### ✅ TypeORMUserRepository (`repositories/TypeORMUserRepository.ts`)
```typescript
- create(user: User) → INSERT con audit fields
- update(user: User) → UPDATE con audit fields
- findById(id: string) → SELECT by PK
- findByEmail(email: string) → SELECT with relation to Role
- listPublic() → SELECT sin passwordHash (seguridad)
- delete(id: string) → DELETE cascade
- EntityToUser mapper (transforma TypeORM → domain types)
```

#### ✅ UserRepository Híbrido (`repositories/userRepository.ts`)
```typescript
- Soporta PostgreSQL primaria (si DATABASE_URL existe)
- Fallback a Map<string, User> en memoria (resilencia)
- initializeDatabase() → conecta async sin bloquear
- Todos los métodos usan: if (usePostgres) → typeormRepo else → inMemory
```

---

### 3️⃣ **AuthService - Core Business Logic** (`services/authService.ts`)

#### ✅ Validaciones
```typescript
- validateEmail(email): @javeriana.edu.co | @puj.edu.co | @estudiantes.puj.edu.co
- validatePassword(pwd): 8+ chars, mayús, minús, digit, special char
- Checks:
  ✓ Email existe → error: 'email_exists'
  ✓ Email formato → error: 'email_invalid_format'
  ✓ Contraseña débil → error: 'password_weak'
  ✓ Usuario inactivo en login → error: 'user_inactive'
```

#### ✅ register(input)
```typescript
1. Validar fullName, email, password
2. Hashear password con bcrypt(salt=12)
3. Crear User(id=UUID, role='student' default, consent=true)
4. await users.create(user)
5. Log: [LEY_1581] User registered with consent: {id} at {timestamp}
6. Return: {id, fullName, institutionalEmail, role, status}
```

#### ✅ login(email, password)
```typescript
1. Encontrar user por email
2. Validar status !== 'inactive'
3. Comparar password con bcrypt.compare()
4. JWT RS256 sign:
   - payload: {sub: userId, role, iss: 'auth-jwt-key', email}
   - expiresIn: '1h'
   - algorithm: 'RS256'
5. Generar refreshToken (UUID)
6. Guardar en Redis: refresh:{token} → userId (TTL 7 días)
7. Return: {accessToken, refreshToken, user}
```

#### ✅ refresh(refreshToken)
```typescript
1. Buscar en Redis: refresh:{token} → userId
2. Deletear el token anterior (rotation)
3. Cargar user
4. Generar nuevo accessToken (RS256, 1h)
5. Generar nuevo refreshToken
6. Guardar en Redis con TTL 7 días
7. Return: {accessToken, refreshToken}
```

#### ✅ logout(token)
```typescript
1. Decodificar JWT sin verificar
2. Calcular TTL restante
3. Agregar a Redis blacklist: blacklist:{token} → '1' (TTL = time until exp)
4. En cada request: authGuard chequea blacklist
```

#### ✅ verifyToken(token)
```typescript
- jwt.verify() con PUBLIC_KEY RS256
- Throws si:
  - Inválido
  - Expirado
  - Algoritmo no RS256
```

#### ✅ isBlacklisted(token)
```typescript
- Chequea Redis key: blacklist:{token}
- Used by authGuard para logout
```

#### ✅ exportUserData(id) - Ley 1581
```typescript
1. Buscar user
2. Log: [LEY_1581] User data export requested: {id}
3. Return: {...user, passwordHashMasked: '****'}
```

#### ✅ deleteUserData(id) - Ley 1581 Right to be Forgotten
```typescript
1. Buscar user
2. Log: [LEY_1581] User data deletion requested: {id}
3. Anonimizar (NOT eliminar por auditoría):
   - fullName → anonymous-{id}
   - institutionalEmail → deleted-{id}@purged.local
   - status → 'inactive'
4. No elimina del DB (audit trail)
```

---

### 4️⃣ **AuthController - HTTP Handlers** (`controllers/authController.ts`)

```typescript
register(req, res)
- POST body: {fullName, institutionalEmail, password, role?}
- Response: 201 + {id, fullName, institutionalEmail, role, status}
- Error: 400 + {error: 'email_invalid_format' | 'password_weak' | etc}

login(req, res)
- POST body: {institutionalEmail, password}
- Response: 200 + {accessToken, refreshToken, user}
- Error: 401 + {error: 'invalid_credentials'}
- Error: 403 + {error: 'user_inactive'}

refresh(req, res)
- POST body: {refreshToken}
- Response: 200 + {accessToken, refreshToken}
- Error: 401 + {error: 'invalid_refresh'}

logout(req, res)
- POST header: Authorization: Bearer <token>
- Response: 204 No Content
- Requiere authGuard

getCurrentUser(req, res)
- GET
- Response: 200 + {userId}
- Requiere authGuard

exportData(req, res) - Ley 1581
- GET /auth/users/{userId}/data
- Response: 200 + UserExport
- RBAC: self o admin
- Requiere authGuard + requireSelfOrRole('admin')

deleteUser(req, res) - Ley 1581
- DELETE /auth/users/{userId}
- Response: 204
- RBAC: self o admin
- Requiere authGuard + requireSelfOrRole('admin')

listUsers(req, res)
- GET /auth/users
- Response: 200 + {users: []}
- RBAC: admin only
- Requiere authGuard + requireRole('admin')
```

---

### 5️⃣ **Middleware - RBAC + JWT** (`middleware/auth.ts`)

#### ✅ authGuard(authService)
```typescript
- Extrae Bearer token de header Authorization
- Chequea si está en blacklist
- Verifica JWT con RS256
- Injeta req.userId, req.role, req.accessToken
- Throws 401 si inválido/expirado/blacklisted
```

#### ✅ requireRole(...roles: string[])
```typescript
- Verifica que req.role esté en la lista de roles permitidos
- Throws 403 si no
- Ejemplo: requireRole('admin')
```

#### ✅ requireSelfOrRole(...roles: string[])
```typescript
- Permite si:
  - req.userId === req.params.id (recurso propio), O
  - req.role está en la lista (admin, etc)
- Throws 403 si no
- Usado en endpoints Ley 1581
```

---

### 6️⃣ **Routes - HTTP Endpoints** (`routes/index.ts`)

```typescript
// Public (rate limited pero sin auth)
POST   /auth/register           → 201 + user
POST   /auth/login              → 200 + {accessToken, refreshToken}
POST   /auth/refresh            → 200 + tokens

// Protected (require authGuard)
POST   /auth/logout             → 204
GET    /auth/user               → 200 + {userId}

// Ley 1581 - Self o Admin
GET    /auth/users/:userId/data → 200 + UserExport
DELETE /auth/users/:userId      → 204

// Admin only
GET    /auth/users              → 200 + {users}

// Rate limiting: 100 req/min per IP (Kong también limita)
```

---

## 🔐 SEGURIDAD IMPLEMENTADA

### ✅ Autenticación JWT RS256
- Private key en `/keys/private.key` (server only)
- Public key en `/keys/public.key` (validación)
- Access token: 1 hora
- Refresh token: 7 días (en Redis)
- Algoritmo asimétrico (no puedo falsificar sin private key)

### ✅ RBAC (Role-Based Access Control)
- 3 roles: student, teacher, admin
- Middleware enforce: requireRole(), requireSelfOrRole()
- Kong también valida en API Gateway

### ✅ Ley 1581 (Protección de Datos Personales)
- ✓ Consentimiento registrado en consentAcceptedAt
- ✓ Encriptación PII en ByteA (fullName, email)
- ✓ Export endpoint para solicitud de datos
- ✓ Delete endpoint anonimiza (derecho al olvido)
- ✓ Logging auditoría: [LEY_1581] eventos

### ✅ Token Security
- ✓ Token blacklist en Redis (logout)
- ✓ Refresh token rotation (invalida anterior)
- ✓ Rate limiting (100 req/min)
- ✓ Password bcrypt(salt=12)
- ✓ Email institucional validado

---

## 📊 IMPACTO EN ATRIBUTOS DE CALIDAD

| Atributo | Impacto |
|----------|---------|
| **DR-03 Seguridad** | ✅ JWT RS256, RBAC, Ley 1581, password strong, token rotation |
| **DR-04 Escalabilidad** | ✅ Redis para tokens, stateless JWT, hybrid DB fallback |
| **DR-05 Mantenibilidad** | ✅ Validaciones centralizadas, middleware reusable, tipos TypeScript |

---

## 🧪 TESTING (E2E tests Ready)

Basado en `tests/e2e/auth.spec.ts`:
- ✓ Register new user with validation
- ✓ Login returns JWT tokens
- ✓ Refresh token generates new access token
- ✓ Invalid credentials return 401
- ✓ Frontend login flow integration

---

## ❌ LO QUE FALTA (Para próximos RFs)

### RF-02: Course Service CRUD
- [ ] CourseEntity, ModuleEntity, MaterialEntity
- [ ] CourseRepository + TypeORM
- [ ] CourseService (CRUD + validations)
- [ ] CourseController (POST/GET/PUT/DELETE)
- [ ] Routes: /courses, /courses/{id}, /courses/{id}/modules, etc

### RF-03: Assessment Service
- [ ] EvaluationEntity, AttemptEntity, GradeEntity
- [ ] AssessmentService (grading <2s requirement)
- [ ] RabbitMQ publisher para evaluacion.completada event
- [ ] Routes: /evaluations, /attempts, /grade

### RF-04: Adaptive Service
- [ ] RabbitMQ consumer para eventos
- [ ] Recommendation rules (pedagógicas)
- [ ] Redis cache para recommendations
- [ ] Circuit breaker (opossum)

---

## 📦 ARCHIVOS MODIFICADOS

```
services/auth-service/src/
├── domain/
│   ├── entities/
│   │   ├── User.ts              ✅ Corregido (transformers, indices, tipos)
│   │   ├── Role.ts              ✅ Corregido (relaciones consistentes)
│   │   ├── Permission.ts        ✅ Renombrado a PermissionEntity
│   │   └── index.ts             ✅ Exports actualizados
│   └── types.ts                 ✅ Types globales
├── repositories/
│   ├── dataSource.ts            ✅ TypeORM config con SSL
│   ├── TypeORMUserRepository.ts ✅ CRUD completo + relations
│   ├── userRepository.ts        ✅ Hybrid PostgreSQL + in-memory
│   └── baseRepository.ts        ⏳ Template (no usado en RF-01)
├── services/
│   ├── authService.ts           ✅ REESCRITO - Validaciones + Ley 1581
│   └── tokenStore.ts            ✅ Redis integration (existente)
├── controllers/
│   └── authController.ts        ✅ REESCRITO - 7 métodos completos
├── middleware/
│   ├── auth.ts                  ✅ authGuard + requireRole + requireSelfOrRole
│   └── logging.ts               ✅ Existente
├── routes/
│   └── index.ts                 ✅ REESCRITO - 9 endpoints
├── utils/
│   └── swagger.ts               ✅ OpenAPI docs
├── app.ts                       ✅ Existente (setupSwaggerUI integrado)
├── index.ts                     ✅ Entry point
└── openapi.yaml                 ✅ OpenAPI 3.0.3 spec
```

---

## ✅ VALIDACIÓN - CÓMO TESTEAR RF-01

```bash
# 1. Iniciar auth-service
cd services/auth-service
npm install
npm run dev  # o npm start

# 2. Testear endpoints
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "institutionalEmail": "john@javeriana.edu.co",
    "password": "SecurePass123!",
    "role": "student"
  }'

# Response: 201
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "John Doe",
  "institutionalEmail": "john@javeriana.edu.co",
  "role": "student",
  "status": "active"
}

# 3. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "institutionalEmail": "john@javeriana.edu.co",
    "password": "SecurePass123!"
  }'

# Response: 200
{
  "accessToken": "eyJhbGci...",  // JWT RS256 1h
  "refreshToken": "550e8400...",
  "user": { ... }
}

# 4. Usar token
curl -X GET http://localhost:3000/auth/user \
  -H "Authorization: Bearer eyJhbGci..."

# Response: 200
{ "userId": "550e8400..." }

# 5. Logout (blacklist)
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer eyJhbGci..."

# Response: 204 No Content

# 6. Swagger UI
open http://localhost:3000/docs
```

---

## 🚀 PRÓXIMO PASO

**RF-02: Course Service CRUD**

Siguiendo el mismo orden del prompt maestro:
1. Entities (Course, Module, Material)
2. TypeORM Repositories
3. Services (CRUD logic)
4. Controllers (HTTP handlers)
5. Routes (endpoints)
6. Middleware (RBAC checks)

**Estimado**: ~2-3 horas de implementación

---

**Entregado por**: GitHub Copilot  
**Fecha**: 31 Mayo 2026  
**Status**: ✅ RF-01 COMPLETADO Y LISTO

Próximo comando: `Implementa RF-02 Course Service`

