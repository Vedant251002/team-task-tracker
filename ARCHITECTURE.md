# 🏗️ Architecture Documentation

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    FRONTEND (Port 3000)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Vite + Tailwind CSS             │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Pages    │  │ Components │  │  Contexts  │         │  │
│  │  │ Dashboard  │  │   Layout   │  │    Auth    │         │  │
│  │  │   Tasks    │  │ TaskModal  │  │            │         │  │
│  │  │   Login    │  │            │  │            │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────┐          │  │
│  │  │         API Services (Axios)                │          │  │
│  │  │  - Authentication  - Task Management        │          │  │
│  │  │  - Token Refresh   - Error Handling         │          │  │
│  │  └────────────────────────────────────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API (JSON)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    BACKEND (Port 5000)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Express.js + TypeScript + Node.js 18             │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │         PRESENTATION LAYER                          │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │ │  │
│  │  │  │Controllers│  │  Routes  │  │Middleware│         │ │  │
│  │  │  │  - Auth  │  │  - Auth  │  │  - Auth  │         │ │  │
│  │  │  │  - Task  │  │  - Task  │  │  - RBAC  │         │ │  │
│  │  │  │  - User  │  │  - User  │  │  - Valid │         │ │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘         │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                          │                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │         APPLICATION LAYER                           │ │  │
│  │  │  ┌──────────────────────────────────────────────┐  │ │  │
│  │  │  │           Services                           │  │ │  │
│  │  │  │  - AuthService    - TaskService              │  │ │  │
│  │  │  │  - UserService    - AnalyticsService         │  │ │  │
│  │  │  └──────────────────────────────────────────────┘  │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                          │                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │         DOMAIN LAYER                                │ │  │
│  │  │  ┌──────────────────────────────────────────────┐  │ │  │
│  │  │  │  Entities & Business Rules                   │  │ │  │
│  │  │  │  - Role (ADMIN, MANAGER, MEMBER)             │  │ │  │
│  │  │  │  - TaskStatus (TODO, IN_PROGRESS, etc.)      │  │ │  │
│  │  │  │  - Priority (LOW, MEDIUM, HIGH)              │  │ │  │
│  │  │  │  - Status Transitions                        │  │ │  │
│  │  │  └──────────────────────────────────────────────┘  │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                          │                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │         INFRASTRUCTURE LAYER                        │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │ │  │
│  │  │  │ Database │  │  Cache   │  │ Security │         │ │  │
│  │  │  │Sequelize │  │  Redis   │  │   JWT    │         │ │  │
│  │  │  │  Models  │  │ Service  │  │ Password │         │ │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘         │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬───────────────────────────┬────────────────────────┘
             │                           │
             │                           │
┌────────────▼────────────┐  ┌──────────▼──────────┐
│   PostgreSQL (5432)     │  │   Redis (6379)      │
│  ┌──────────────────┐   │  │  ┌──────────────┐   │
│  │  organizations   │   │  │  │ Task Lists   │   │
│  │  users           │   │  │  │ Cache        │   │
│  │  tasks           │   │  │  │ TTL: 5 min   │   │
│  │  refresh_tokens  │   │  │  └──────────────┘   │
│  └──────────────────┘   │  └─────────────────────┘
└─────────────────────────┘
```

## Data Flow Diagrams

### Authentication Flow

```
┌──────┐                                                    ┌──────────┐
│Client│                                                    │  Server  │
└──┬───┘                                                    └────┬─────┘
   │                                                             │
   │  POST /api/auth/login                                      │
   │  { email, password }                                       │
   ├────────────────────────────────────────────────────────────>
   │                                                             │
   │                                    Validate credentials    │
   │                                    Hash password check     │
   │                                    Generate JWT tokens     │
   │                                    Store refresh token     │
   │                                                             │
   │  200 OK                                                    │
   │  { user, accessToken, refreshToken }                       │
   <────────────────────────────────────────────────────────────┤
   │                                                             │
   │  Store tokens in localStorage                              │
   │                                                             │
   │  GET /api/tasks                                            │
   │  Authorization: Bearer {accessToken}                       │
   ├────────────────────────────────────────────────────────────>
   │                                                             │
   │                                    Verify JWT              │
   │                                    Check permissions       │
   │                                    Fetch tasks             │
   │                                                             │
   │  200 OK                                                    │
   │  { tasks: [...] }                                          │
   <────────────────────────────────────────────────────────────┤
   │                                                             │
```

### Token Refresh Flow

```
┌──────┐                                                    ┌──────────┐
│Client│                                                    │  Server  │
└──┬───┘                                                    └────┬─────┘
   │                                                             │
   │  GET /api/tasks                                            │
   │  Authorization: Bearer {expired_token}                     │
   ├────────────────────────────────────────────────────────────>
   │                                                             │
   │                                    Token expired!          │
   │                                                             │
   │  401 Unauthorized                                          │
   │  { code: "TOKEN_EXPIRED" }                                 │
   <────────────────────────────────────────────────────────────┤
   │                                                             │
   │  Interceptor catches 401                                   │
   │                                                             │
   │  POST /api/auth/refresh                                    │
   │  { refreshToken }                                          │
   ├────────────────────────────────────────────────────────────>
   │                                                             │
   │                                    Verify refresh token    │
   │                                    Delete old token        │
   │                                    Generate new tokens     │
   │                                    Store new refresh token │
   │                                                             │
   │  200 OK                                                    │
   │  { accessToken, refreshToken }                             │
   <────────────────────────────────────────────────────────────┤
   │                                                             │
   │  Update tokens in localStorage                             │
   │  Retry original request                                    │
   │                                                             │
   │  GET /api/tasks                                            │
   │  Authorization: Bearer {new_token}                         │
   ├────────────────────────────────────────────────────────────>
   │                                                             │
   │  200 OK                                                    │
   │  { tasks: [...] }                                          │
   <────────────────────────────────────────────────────────────┤
   │                                                             │
```

### Task Creation with Caching

```
┌──────┐                ┌──────────┐              ┌──────────┐              ┌───────┐
│Client│                │  Server  │              │PostgreSQL│              │ Redis │
└──┬───┘                └────┬─────┘              └────┬─────┘              └───┬───┘
   │                         │                         │                        │
   │  POST /api/tasks        │                         │                        │
   │  { title, ... }         │                         │                        │
   ├────────────────────────>│                         │                        │
   │                         │                         │                        │
   │                         │  Validate input         │                        │
   │                         │  Check permissions      │                        │
   │                         │                         │                        │
   │                         │  INSERT INTO tasks      │                        │
   │                         ├────────────────────────>│                        │
   │                         │                         │                        │
   │                         │  Task created           │                        │
   │                         <────────────────────────┤                        │
   │                         │                         │                        │
   │                         │  Invalidate cache       │                        │
   │                         │  DEL tasks:org:*        │                        │
   │                         ├────────────────────────────────────────────────>│
   │                         │                         │                        │
   │                         │  Cache cleared          │                        │
   │                         <────────────────────────────────────────────────┤
   │                         │                         │                        │
   │  201 Created            │                         │                        │
   │  { task }               │                         │                        │
   <────────────────────────┤                         │                        │
   │                         │                         │                        │
```

### Task List with Cache

```
┌──────┐                ┌──────────┐              ┌──────────┐              ┌───────┐
│Client│                │  Server  │              │PostgreSQL│              │ Redis │
└──┬───┘                └────┬─────┘              └────┬─────┘              └───┬───┘
   │                         │                         │                        │
   │  GET /api/tasks         │                         │                        │
   ├────────────────────────>│                         │                        │
   │                         │                         │                        │
   │                         │  Check cache            │                        │
   │                         │  GET tasks:org:123:...  │                        │
   │                         ├────────────────────────────────────────────────>│
   │                         │                         │                        │
   │                         │  Cache MISS             │                        │
   │                         <────────────────────────────────────────────────┤
   │                         │                         │                        │
   │                         │  SELECT * FROM tasks    │                        │
   │                         ├────────────────────────>│                        │
   │                         │                         │                        │
   │                         │  Tasks data             │                        │
   │                         <────────────────────────┤                        │
   │                         │                         │                        │
   │                         │  Store in cache         │                        │
   │                         │  SETEX tasks:... 300    │                        │
   │                         ├────────────────────────────────────────────────>│
   │                         │                         │                        │
   │  200 OK                 │                         │                        │
   │  { tasks: [...] }       │                         │                        │
   <────────────────────────┤                         │                        │
   │                         │                         │                        │
   │  GET /api/tasks (again) │                         │                        │
   ├────────────────────────>│                         │                        │
   │                         │                         │                        │
   │                         │  Check cache            │                        │
   │                         │  GET tasks:org:123:...  │                        │
   │                         ├────────────────────────────────────────────────>│
   │                         │                         │                        │
   │                         │  Cache HIT ✓            │                        │
   │                         │  (no DB query!)         │                        │
   │                         <────────────────────────────────────────────────┤
   │                         │                         │                        │
   │  200 OK (faster!)       │                         │                        │
   │  { tasks: [...] }       │                         │                        │
   <────────────────────────┤                         │                        │
   │                         │                         │                        │
```

## Database Schema

```
┌─────────────────────┐
│   organizations     │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N
           │
    ┌──────┴─────────────────────┐
    │                            │
┌───▼──────────────┐      ┌──────▼─────────────┐
│      users       │      │       tasks        │
├──────────────────┤      ├────────────────────┤
│ id (PK)          │◄─────┤ assignee_id (FK)   │
│ email (UQ)       │      │ creator_id (FK)    │
│ password         │      │ organization_id(FK)│
│ name             │      ├────────────────────┤
│ role             │      │ id (PK)            │
│ organization_id  │      │ title              │
│ created_at       │      │ description        │
│ updated_at       │      │ priority           │
└────────┬─────────┘      │ status             │
         │                │ due_date           │
         │ 1:N            │ completed_at       │
         │                │ created_at         │
┌────────▼─────────┐      │ updated_at         │
│ refresh_tokens   │      └────────────────────┘
├──────────────────┤
│ id (PK)          │      Indexes:
│ token (UQ)       │      - status
│ user_id (FK)     │      - assignee_id
│ expires_at       │      - due_date
│ created_at       │      - organization_id
└──────────────────┘      - (organization_id, status)
```

## RBAC Permission Matrix

```
┌──────────────────┬───────┬─────────┬────────┐
│     Action       │ ADMIN │ MANAGER │ MEMBER │
├──────────────────┼───────┼─────────┼────────┤
│ View All Tasks   │   ✓   │    ✓    │   ✗    │
│ View Own Tasks   │   ✓   │    ✓    │   ✓    │
│ Create Task      │   ✓   │    ✓    │   ✓    │
│ Update Any Task  │   ✓   │    ✓    │   ✗    │
│ Update Own Task  │   ✓   │    ✓    │   ✓    │
│ Delete Task      │   ✓   │    ✓    │   ✗    │
│ Manage Users     │   ✓   │    ✗    │   ✗    │
│ View Analytics   │   ✓   │    ✓    │   ✗    │
│ Change User Role │   ✓   │    ✗    │   ✗    │
└──────────────────┴───────┴─────────┴────────┘
```

## Task Status State Machine

```
                    ┌──────────┐
                    │   TODO   │
                    └────┬─────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ IN_PROGRESS │
                  └──────┬──────┘
                         │
                         ▼
                   ┌───────────┐
                   │ IN_REVIEW │
                   └─────┬─────┘
                         │
                         ▼
                    ┌────────┐
                    │  DONE  │
                    └────────┘

         Any State ──────────────────> BLOCKED
```

Valid Transitions:
- TODO → IN_PROGRESS, BLOCKED
- IN_PROGRESS → IN_REVIEW, BLOCKED
- IN_REVIEW → DONE, BLOCKED
- BLOCKED → TODO, IN_PROGRESS, IN_REVIEW
- DONE → (no transitions allowed)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Docker Compose Network                 │  │
│  │                                                   │  │
│  │  ┌──────────────┐      ┌──────────────┐         │  │
│  │  │   Frontend   │      │   Backend    │         │  │
│  │  │   Container  │      │   Container  │         │  │
│  │  │   Port 3000  │      │   Port 5000  │         │  │
│  │  └──────────────┘      └───────┬──────┘         │  │
│  │                                 │                 │  │
│  │                        ┌────────┴────────┐       │  │
│  │                        │                 │       │  │
│  │                ┌───────▼──────┐  ┌──────▼─────┐ │  │
│  │                │  PostgreSQL  │  │   Redis    │ │  │
│  │                │   Container  │  │  Container │ │  │
│  │                │   Port 5432  │  │  Port 6379 │ │  │
│  │                └──────────────┘  └────────────┘ │  │
│  │                                                   │  │
│  │  Volumes:                                        │  │
│  │  - postgres_data (persistent)                    │  │
│  │  - redis_data (persistent)                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

This architecture ensures:
- ✅ Separation of concerns
- ✅ Scalability
- ✅ Maintainability
- ✅ Security
- ✅ Performance
- ✅ Testability
