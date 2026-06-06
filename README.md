# NestJS Backend Track

**Goal:** Structured NestJS backend learning through hands-on implementation of real-world patterns—users, posts, tags, metadata—with focus on persistence, relationships, validation, and reusable architecture.

**Status:** Week 11 complete. All core CRUD flows for 4 major entities with many-to-many relationships, validated DTOs, full exception handling layer (8 helpers + bulk-operation helper covering 400/401/403/404/408/409/500/503), database relationships modeled (TypeORM entities), API documentation with Swagger (including Bearer auth), DB outage resilience enabled, **bulk operations with atomic transactions** implemented for high-priority modules (users, posts, tags), **hardened shared pagination applied to all list GET endpoints**, **JWT configuration consolidated to shared config**, **global route protection enabled via AuthenticationGuard (default Bearer, explicit public opt-out via @Auth(AuthType.None))**, **Google OAuth 2.0 API wrapper integrated** with `GoogleAuthenticationService` for third-party authentication via `POST /v1/auth/google-authentication`, **dynamic filtering & sorting on all list endpoints** with full Swagger documentation and Bearer token authentication, **complete request lifecycle implemented** with global exception filter for error response shaping and `@nestjs/throttler` for rate limiting (100 req/60s per IP), **file uploads with Azure Blob Storage + Front Door CDN**, **mail module with EJS template rendering and SMTP transport** with welcome emails sent on user registration, **unit test coverage at 80%+ statements** (41 suites, 247 tests — all passing).

## Base Structure

- `src/modules/users` - User management with CRUD, DTO validation, and email-based author resolution.
- `src/modules/posts` - Blog post CRUD with repository persistence, validated DTOs, author ownership, tag resolution, and metadata nesting.
- `src/modules/tags` - Tag create/list with many-to-many relation to posts via `post_tags` junction table.
- `src/modules/meta-options` - JSON-backed metadata for posts with one-to-one relation.
- `src/modules/uploads` - File uploads with Azure Blob Storage backend, CDN URL generation, and metadata persistence.
- `src/modules/auth` - Authentication module with JWT-based auth, Google OAuth 2.0 wrapper, token generation and refresh.
- `src/modules/mail` - Email delivery with EJS template rendering, SMTP transport, and welcome email on user registration.
- `src/common/exceptions` - Full exception handling layer: 404, 409, 400, 408, 401, 403, 503, 500 helpers.
- `src/common/validators` - Reusable tag relation validator for many-to-many integrity.
- `src/helpers` - Response formatting and JSON parsing helpers.
- `src/common` - Shared guards, interceptors, filters, pipes.
- `src/config` - Environment and app config.
- `src/database` - DB setup and relationships support (entities/schemas, migrations).
- `test` - Unit and integration tests.
- `docs` - Roadmap, design notes, and check-ins.

## Key Implementation Highlights

- **Many-to-Many Relations:** Posts ↔ Tags via TypeORM `@ManyToMany` + `@JoinTable` with automatic junction table (`post_tags`).
- **Repository Pattern:** All persistence delegated to TypeORM repositories with service-level queries and error mapping.
- **DTO Validation:** Every endpoint enforces request shape via class-validator decorators (enums, URLs, arrays, nested objects).
- **Relationship Integrity:** Service-level tag resolution rejects requests with missing tags (404), validated on create/update/patch.
- **Unique Constraint Handling:** DB uniqueness violations (e.g., duplicate slugs) mapped to clean 409 Conflict responses.
- **Global Exception Filter & Error Response Shaping:** `HttpExceptionFilter` intercepts all exceptions at filter stage, formats uniform responses with `statusCode`, `timestamp`, `path`, and `message` fields, and logs unexpected errors via injected `Logger` for observability.
- **Rate Limiting (Throttler Guard):** Global rate limit of 100 requests per 60-second window per client IP; excess requests receive 429 Too Many Requests; sensitive routes (e.g., auth endpoints) can enforce stricter limits via `@Throttle(limit, ttl)` decorator.
- **Full Exception Layer:** 9 reusable helpers cover every HTTP error scenario at the service layer:
  - `bad-request.helper` — email format, password strength, field length, required fields (400)
  - `unauthorized.helper` — token presence, user auth state, JWT errors (401)
  - `forbidden.helper` — role validation, resource ownership, role hierarchy (403)
  - `not-found.helper` — resource existence assertions (404)
  - `request-timeout.helper` — DB query and network timeout detection (408)
  - `unique-constraint.helper` — DB unique constraint mapping (409)
  - `internal-error.helper` — unexpected errors with server-side NestJS Logger (500)
  - `service-unavailable.helper` — DB/service connectivity failures (503)
  - `bulk-operation-error.helper` — cascading error handling for transactional bulk operations (503 → 408 → 500)
- **Bulk Operations with Atomic Transactions:** All-or-nothing semantics via TypeORM QueryRunner:
  - `POST /v1/users/bulk` — Atomic user creation (max 100 per batch); validates batch size, detects duplicate emails
  - `POST /v1/posts/bulk` — Atomic post creation (max 50 per batch); handles tag resolution and author lookup atomically; detects duplicate slugs
  - `POST /v1/tags/bulk` — Atomic tag creation (max 100 per batch); validates batch size, detects duplicate slugs
  - All bulk endpoints: rollback entire batch on validation error, DB constraint violation, or missing relationship; response documents affected count and error details
- **Resilient DB Lifecycle:** API process can boot while DB is down, retries connection in background, and returns 503 for DB-dependent endpoints until DB reconnects.
- **Global Auth Guard:** `AuthenticationGuard` is registered as `APP_GUARD`; routes are protected by default using Bearer JWT unless explicitly marked public with `@Auth(AuthType.None)`.
- **JWT-Based Author Identity:** Post creation now derives the author from authenticated token claims (`@ActiveUser`) instead of accepting `authorEmail` in create payloads.
- **Shared Pagination (Hardened):** List endpoints now use common pagination contracts and response shape:
  - `GET /v1/users?page=1&limit=10`
  - `GET /v1/posts?page=1&limit=10`
  - `GET /v1/tags?page=1&limit=10`
  - Shared implementation via `PaginationQueryDto`, `PaginationProvider`, and `IPaginated<T>` response metadata/links.
  - Hardening rules implemented: max `limit` cap (`100`), deterministic default ordering (`id DESC`), query-preserving pagination links, and empty-result-safe metadata.
- **Swagger Documentation:** All endpoints documented with request/response shapes, error codes, and parameter descriptions.
- **Compodoc 100% Coverage:** All exports have JSDoc (class, method, property, interface).
- **Centralized Global Infrastructure (AppModule):** All global handlers registered via `APP_*` tokens in module for DI-managed lifecycle: `APP_GUARD` (authentication, throttling), `APP_INTERCEPTOR` (serialization, response formatting), `APP_PIPE` (validation), `APP_FILTER` (exception handling).

## Setup & Run

### Prerequisites
- Node.js v18+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Create `.env` in project root:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=nestjs_backend
JWT_SECRET=replace_with_strong_secret
JWT_ACCESS_TOKEN_TTL=3600
JWT_TOKEN_AUDIENCE=localhost:8080
JWT_TOKEN_ISSUER=localhost:8080
```

### Start Development Server

```bash
npm run start:dev
```

Server runs on `http://localhost:8000`

- **Swagger Docs:** `http://localhost:8000/api`
- **Health Check:** `http://localhost:8000/` (unversioned)
- **API Prefix:** `/v1` (e.g., `GET /v1/posts`)

### Run Tests

```bash
npm run test
```

## Request Lifecycle Reference

Full NestJS request/response flow as implemented:

```
Request → Middleware (optional) → Guards → Interceptors (pre) → Pipes → Controller → Service → Interceptors (post) → Response
                                                                                         ↓ (exception)
                                                                              Exception Filter ← catches here
```

**Implemented components:**
- **Guards:** `AuthenticationGuard` (default Bearer + public opt-out), `ThrottlerGuard` (100 req/60s)
- **Interceptors (pre/post):** `ClassSerializerInterceptor` (class-transformer), `DataResponseInterceptor` (standardized JSON shape)
- **Pipes:** `ValidationPipe` (class-validator, whitelist, forbid unknown)
- **Exception Filter:** `HttpExceptionFilter` (catch-all, formats error responses with timestamp/path, logs unhandled errors)
- **Middleware:** Omitted (optional for learning scope; useful for logging, rate limiting, CORS which are handled via guards/config)

**Registering global handlers in `AppModule` via `APP_*` tokens ensures:**
- DI container manages all global infrastructure
- Consistent dependency injection (e.g., services, loggers can be injected into filters)
- Single source of truth for lifecycle configuration

### Generate Documentation

```bash
npm run doc      # One-time generation to ./.compodoc
npm run doc:serve # Serve generated docs locally
npm run doc:watch # Watch and rebuild on file changes
```

## Database & Migrations

### Runtime DB Resilience (Current Learning Setup)
- `manualInitialization: true` in TypeORM config keeps Nest startup independent from immediate DB availability.
- `DatabaseConnectionBootstrap` retries `DataSource.initialize()` every 5 seconds until successful.
- During outage, DB-dependent endpoints return `503 Service Unavailable` through `service-unavailable.helper`.
- After PostgreSQL comes back, the running app reconnects automatically (no app restart required).

### Windows PostgreSQL Service Commands

Run in Administrator PowerShell:

```powershell
Start-Service -Name postgresql-x64-18
Stop-Service -Name postgresql-x64-18
Get-Service -Name postgresql-x64-18
```

Connection check:

```powershell
pg_isready -h localhost -p 5432
```

### Port Conflict Troubleshooting (EADDRINUSE)

If `npm run start:dev` shows `EADDRINUSE: address already in use :::8000`, another process is already listening on port 8000.

```powershell
Get-NetTCPConnection -LocalPort 8000 -State Listen
taskkill /PID <pid> /F
npm run start:dev
```

### Current Setup (Week 1)
- **Mode:** Development with `synchronize: true`
- **Workflow:** Update entities → restart server → schema auto-applies
- **Entities:** User, Post, Tag, MetaOption auto-discovered and synced
- **No action required:** Just edit entities and restart `npm run start:dev`

### Migration Infrastructure (Ready for Production)
Configuration is in place at `src/database/data-source.ts`. When you reach the Migrations lesson in Week 2+, switch to explicit migrations:

```bash
npm run migration:generate -- -n DescriptiveChangeName  # Auto-generate from entity diff
npm run migration:run                                   # Apply pending migrations
npm run migration:revert                                # Rollback last migration
```

Migration files auto-save to `src/database/migrations/` and track your schema history in version control.

## Project Files

- **[docs/roadmap.md](docs/roadmap.md)** — Course lessons mapped to implementation with status tracking.
- **[docs/learning-issues.md](docs/learning-issues.md)** — Resolved issues, root causes, fixes, and quick reference Q&A.
- **[docs/coding-standards.md](docs/coding-standards.md)** — Code style, error handling, tests, and JSDoc expectations.
- **[docs/weekly-checkins.md](docs/weekly-checkins.md)** — Week-by-week progress summaries.

## Endpoints Overview

### Users
- `POST /v1/users` - Create user
- `POST /v1/users/create-many` - Bulk create users (atomic transaction, max 100 per batch)
- `GET /v1/users?sortBy=firstName&sortOrder=asc&search=john&page=1&limit=10` - List users with search, sort, and pagination
- `GET /v1/users/:id` - Get user by ID
- `PUT /v1/users/:id` - Replace user
- `PATCH /v1/users/:id` - Partial update
- `DELETE /v1/users/:id` - Delete user

### Posts
- `POST /v1/posts` - Create post with tags and metadata (author derived from JWT token)
- `POST /v1/posts/create-many` - Bulk create posts (atomic transaction, max 50 per batch; handles tags & authenticated author atomically)
- `GET /v1/posts?sortBy=createdAt&sortOrder=desc&status=published&search=nestjs&startDate=2026-01-01&endDate=2026-12-31&page=1&limit=10` - List posts with filters, sort, and pagination
- `GET /v1/posts/:id` - Get post by ID
- `PUT /v1/posts/:id` - Full update (replaces tags and metadata)
- `PATCH /v1/posts/:id` - Partial update (selective tag/metadata updates)
- `DELETE /v1/posts/:id` - Delete post

### Tags
- `POST /v1/tags` - Create tag
- `POST /v1/tags/create-many` - Bulk create tags (atomic transaction, max 100 per batch)
- `GET /v1/tags?sortBy=name&sortOrder=asc&search=react&page=1&limit=10` - List tags with search, sort, and pagination
- `GET /v1/tags/:id` - Get tag with associated posts
- `DELETE /v1/tags/:id` - Soft-delete tag

### Auth
- `POST /v1/auth/sign-in` - Public sign-in endpoint that returns JWT access token

### Meta Options
- `POST /v1/meta-options` - Create metadata entry

## Architecture Decisions

| Pattern | Why |
|---------|-----|
| Repository + Service | Decouples domain logic from DB implementation; easier testing. |
| @JoinTable for Many-to-Many | Normalized DB structure; supports complex queries and reuse. |
| Validation at DTO Layer | Enforces contracts early; cleaner service methods. |
| Layered Exception Helpers | Each HTTP error type has its own helper; consistent responses across all service methods. |
| Eager Loading (Tags, Meta) | Reduces N+1 queries in post responses. |
| JWT-Based Author Lookup | Write operations derive actor identity from verified token claims instead of trusting request body author identifiers. |
| Server-Side Error Logging | Internal errors logged with context via NestJS Logger; generic message returned to client. |
| Dynamic Filtering & Sorting | Allowlist validation on sortBy fields prevents SQL injection; TypeORM operators (ILike, Between) provide clean abstraction. |
| DTO Composition with IntersectionType | Reusable filter/sort/pagination layer across all modules; clean separation of concerns. |

## Next Steps (Post-Week 9)

1. **Global exception filter** — standardise error response shape to match `{ apiVersion, data }` envelope.
2. **Logger middleware** — log method + URL on every request to complete the full NestJS pipeline.
3. **E2E tests for bulk operations** — test success paths, transaction rollback scenarios, and error responses for users/posts/tags bulk endpoints.
4. Add auth-focused E2E tests for global guard defaults and explicit public-route opt-outs.
5. **Migrate to explicit TypeORM migrations** (infrastructure ready in `src/database/data-source.ts`; switch `synchronize: false` when ready; see "Database & Migrations" section).
6. Explore Docker setup for containerized local development.
7. Add health endpoints that separate API liveness from DB readiness.

## Learning Philosophy

- **Incremental:** Each lesson = one practical change in code, mapped to roadmap.
- **Verified:** Every endpoint tested manually (Swagger/curl) or via automated tests.
- **Documented:** Issues, decisions, and insights logged immediately in `docs/`.
- **Reusable:** Common patterns (validation, exception handling) extracted into helpers early.

---

## Original Starter (For Reference)

```bash
npm i -g @nestjs/cli
nest new nestjs-backend
npm run start:dev
```