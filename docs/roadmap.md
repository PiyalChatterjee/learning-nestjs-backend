# NestJS Masterclass Roadmap (Learning Course)

## Goal

Build a course-aligned backend in small learning increments, with proof of implementation and a clear next-step backlog.

## Current Snapshot (2026-06-07)

- **Request Lifecycle Complete (Middleware omitted as optional):** All core NestJS request/response phases implemented—guards, interceptors, pipes, exception filters—with global registration in `AppModule` for consistency.
- **Global Exception Filter implemented**: `HttpExceptionFilter` catches all exceptions at filter stage, formats responses with timestamp/path/message, and logs unhandled (non-HttpException) errors via injected `Logger`.
- **Mail module with EJS templating complete**: MailerModule configured with SMTP transport, EJS template adapter, and welcome email service; templates auto-copied to dist via nest-cli asset config; sendWelcomeEmail triggered on new user registration with HTML template and plain-text fallback.
- **Rate Limiting (Throttler)**: `@nestjs/throttler` guard active globally with 100 requests per 60-second window per client IP; returns 429 on limit exceeded; sensitive routes can apply stricter limits via `@Throttle()` decorator.
- **Validation Pipe migrated to AppModule**: Moved from `main.ts` to module-level `APP_PIPE` for centralized global infrastructure management.
- Core app bootstrap is in place with versioned routing and validation.
- Users module has full controller-level CRUD-style routes with DTO validation and TypeORM repository-backed service methods.
- Posts module has CRUD endpoints (create, get all, get by id, put, patch, delete) with validated DTOs, enums, repository-backed service methods, formatted author details, and relation-aware tag resolution.
- Global authentication guard is active via APP_GUARD with default `AuthType.Bearer`; public routes are explicitly marked with `@Auth(AuthType.None)` (for example, `POST /v1/auth/sign-in`).
- Post creation now resolves author identity from JWT claims (`activeUser.email`) instead of accepting `authorEmail` in create payloads.
- Tags module now supports create/get/delete flows and is linked to posts through many-to-many mapping with a junction table.
- **Google OAuth API wrapper implemented**: `GoogleAuthenticationService` wraps Google Auth Library OAuth2Client; supports ID token verification, user lookup by `googleId`, and JWT token generation; config credentials stored in `appConfig.jwt.googleOAuth` namespace; `POST /v1/auth/google-authentication` endpoint added with 401 response when user not found.
- **Config fixes applied**: Fixed TypeORM `synchronize` flag parsing (boolean vs string comparison) to allow auto-schema updates in development.
- Reusable relation validator and exception helpers are now used for cleaner service logic:
	- tag relation resolution moved to a common validator
	- DB unique constraint translation moved to a common exception helper
- Shared reusable not-found exception helper is implemented and used in users and posts services.
- Post entity now models:
	- author ownership via users relation (`author_id`)
	- post metadata via one-to-one relation (`meta_option_id`)
	- tag associations via many-to-many relation (`post_tags`)
- Swagger is configured and available at /api.
- Compodoc workflow is set with build/serve/watch scripts and generated output isolated to .compodoc.
- JSDoc coverage is complete for scoped backend source files.
- **Full exception handling layer is in place** across all service methods:
	- `not-found.helper.ts` — 404 resource guards
	- `unique-constraint.helper.ts` — 409 DB constraint violations
	- `bad-request.helper.ts` — 400 input validation (email format, password strength, field length)
	- `request-timeout.helper.ts` — 408 timeouts (DB queries, network ops)
	- `unauthorized.helper.ts` — 401 auth failures (token missing/invalid/expired)
	- `forbidden.helper.ts` — 403 permission/role/ownership checks
	- `service-unavailable.helper.ts` — 503 DB/service connection failures
	- `internal-error.helper.ts` — 500 unexpected errors with server-side logging
- Database lifecycle is now resilient for local learning scenarios:
	- app startup no longer hard-fails when PostgreSQL is down
	- background retry bootstrap initializes DB when service comes back
	- DB-down request-time failures are mapped to 503 and recover to normal responses after reconnection
- **Bulk operations & transactions fully implemented and tested** for users, posts, and tags modules:
	- `UserCreateManyProvider` with atomic transactions for users (max 100) — tested with 4 users
	- `PostCreateManyProvider` with atomic transactions for posts (max 50) — tested with 3 posts and tag resolution
	- `TagCreateManyProvider` with atomic transactions for tags (max 100) — tested with 3 tags
	- All providers: batch validation (size limits, empty batch checks, duplicate slug/email detection)
	- All providers: use `bulk-operation-error.helper` for cascading error handling
	- All-or-nothing semantics with transaction rollback on any validation or DB error
	- All three endpoints wired and documented in HTTP files
	- Pattern is reusable for future bulk operations (meta-options, etc.)
	- Successful manual tests confirm atomic transaction behavior working correctly
- **Pagination implemented across all list GET endpoints** using shared abstractions:
	- `GET /users`, `GET /posts`, and `GET /tags` now accept `page` and `limit` query params
	- `PaginationQueryDto` standardizes query validation/defaults
	- `PaginationProvider` and `IPaginated<T>` standardize list response metadata and navigation links
	- Hardened behavior now includes max limit cap, deterministic default ordering, query-preserving links, and empty-result-safe pagination metadata
	- Architecture discussion notes are captured in `docs/learning-issues.md` under "Pagination Architecture Review (Discussion Summary)"
- **Dynamic Filtering and Sorting implemented** on all three list endpoints:
	- `GET /v1/posts?sortBy=createdAt&sortOrder=asc&status=published&search=nestjs&startDate=2026-01-01&endDate=2026-12-31`
	- `GET /v1/users?sortBy=firstName&sortOrder=desc&search=john`
	- `GET /v1/tags?sortBy=name&sortOrder=asc&search=react`
	- `SortQueryDto` and module-specific filter DTOs composed via `IntersectionType`
	- Posts: date range filters (startDate/endDate), status filter, title search
	- Users: firstName search
	- Tags: name search
	- Allowlist validation on sortBy to prevent SQL injection
	- Case-insensitive partial matching via TypeORM ILike operator
- **Swagger Bearer Authentication configured**:
	- DocumentBuilder configured with `.addBearerAuth()` in bootstrap
	- All protected controllers decorated with `@ApiBearerAuth('access-token')`
	- Swagger UI now displays "Authorize" button for JWT token entry
	- All protected endpoints automatically documented as requiring Bearer token
- **Full Swagger documentation** with @ApiPropertyOptional decorators on all filter, sort, and pagination query parameters
- **File uploads module completed with Azure Blob Storage** (AWS replacement):
	- `POST /v1/uploads/file` and `POST /v1/uploads/files` implemented and manually verified
	- Upload metadata persisted in `uploads` table (`blobName`, `url`, `size`, `mimeType`, `originalFileName`, `uploadedAt`)
	- CDN delivery integrated through Azure Front Door endpoint (`AZURE_CDN_ENDPOINT`) with safe fallback to direct blob URL
	- Upload routes explicitly marked public with `@Auth(AuthType.None)` under global auth guard strategy
- **Mail module with EJS templates and SMTP integration**:
	- MailerModule configured via AppModule with configurable SMTP host/port/auth
	- EJS template adapter set up at `src/modules/mail/templates/`
	- Automatic asset copy during build: templates included in dist via `nest-cli.json` asset glob
	- `sendWelcomeEmail()` triggered on user registration; generates HTML body from EJS template + plain-text fallback
	- From address and template config managed via ConfigService for environment flexibility

## Week-by-Week Status

## Week 1: Setup + Users Module Foundations

Status: Complete

- Project structure and runtime flow implemented in app bootstrap and module wiring.
- Modules/controllers/providers/DI implemented for users, posts, and auth modules.
- Global ValidationPipe configured with whitelist, transform, and forbidNonWhitelisted.
- Users DTO contracts and baseline user endpoints implemented.

## Week 2: Users Module Completion

Status: Complete (Learning Scope)

- Implemented users endpoints: get all (paginated), get by id, create, put, patch, delete.
- DTOs in place: create, update, patch.
- Service now uses TypeORM repository operations (find/create/save/remove) and reusable 404 behavior.
- Auth interaction is currently basic (token check placeholder), not production-grade auth.

## Week 3: Posts Module

Status: Complete (Learning Scope)

- Implemented posts endpoints: get all, get by id, create, put, patch by id, delete.
- Post DTOs and enums implemented (create, update, patch + post type/status/meta options), with author derived from authenticated JWT claims.
- Reusable not-found handling integrated in posts service.
- Service uses repository pattern with email-based author lookup and author response formatting.

## Week 4: Database Relationships Module

Status: Complete (Learning Scope)

- TypeORM entities are wired for persistence in users/posts/tags/meta-options services.
- Post-to-user ownership relation is modeled via `ManyToOne` (`author_id`).
- Post-to-meta relation is modeled via `OneToOne` (`meta_option_id`).
- Post-to-tag relation is modeled via `ManyToMany` with join table (`post_tags`).
- Service-level relation integrity checks are in place for tags (missing tags return 404).
- Remaining: add inverse relations where useful and tighten migration strategy (reduce reliance on synchronize).

## Week 5: API Documentation Workflow

Status: Complete (2026-06-04)

- Swagger setup complete in bootstrap and endpoint decorators applied.
- Compodoc installed and script workflow standardized.
- Documentation generation scripts:
	- npm run doc
	- npm run doc:serve
	- npm run doc:watch
- Generated docs output moved to .compodoc and ignored from git tracking.

## Week 6: Auth + Advanced NestJS Concepts

Status: Complete (Learning Baseline)

- Auth module and service wiring are complete.
- ForwardRef cross-module wiring between auth and users is implemented.
- Global `AuthenticationGuard` is registered through `APP_GUARD`.
- Default route protection is Bearer JWT, with route-level override via `@Auth(AuthType.None)`.
- `AccessTokenGuard` populates request user claims for downstream use through `@ActiveUser()`.

## Week 7: Exception Handling

Status: Complete (2026-05-29)

- Full exception handling layer implemented across all service methods.
- 8 reusable exception helpers created in `src/common/exceptions/`:
	- `not-found.helper.ts` — 404 resource existence assertions
	- `unique-constraint.helper.ts` — 409 DB unique constraint mapping
	- `bad-request.helper.ts` — 400 input validation (email format, password strength, field length, required fields)
	- `request-timeout.helper.ts` — 408 timeout detection (ECONNABORTED, ETIMEDOUT, deadlocks)
	- `unauthorized.helper.ts` — 401 auth failures (token presence, user auth state, JWT errors)
	- `forbidden.helper.ts` — 403 permission checks (role validation, resource ownership, role hierarchy)
	- `service-unavailable.helper.ts` — 503 service connectivity (ECONNREFUSED, ENOTFOUND, pool exhausted)
	- `internal-error.helper.ts` — 500 unexpected errors with server-side logging via NestJS Logger
- All service layers (users, posts, tags, meta-options, auth) updated with layered try-catch handling.
- AuthService enhanced with token presence checks and auth-failure exception mapping.
- UsersService enhanced with duplicate email detection on update/patch operations.

## Week 8: Bulk Operations & Transactions (High-Priority Modules)

Status: Complete (2026-06-01)

- **Users module:** Bulk creation via `UserCreateManyProvider` (max 100 users)
  - Batch size validation, duplicate email detection, atomic transaction
- **Posts module:** Bulk creation via `PostCreateManyProvider` (max 50 posts)
  - Handles tag resolution and author lookup atomically
  - Batch size validation, duplicate slug detection, atomic transaction
- **Tags module:** Bulk creation via `TagCreateManyProvider` (max 100 tags)
  - Batch size validation, duplicate slug detection, atomic transaction
- Reusable `bulk-operation-error.helper.ts` for cascading error handling across all bulk providers
- New Swagger endpoints:
	- `POST /users/create-many` — bulk user creation
	- `POST /posts/create-many` — bulk post creation with tags
	- `POST /tags/create-many` — bulk tag creation
- All tests pass (12 test suites, 12 passed); providers mocked in service tests
- Pattern is documented and ready for reuse in meta-options or future modules

## Week 9: Quality + Auth Configuration + Querying + Interceptors + Serialization

Status: Complete (2026-06-06)

- **JWT global configuration consolidation** — JWT config moved from auth module local scope to global app config with environment validation (2026-06-03).
- **Global guard rollout completed** — `AuthenticationGuard` is applied via `APP_GUARD` with default Bearer protection and explicit public-route opt-out using `@Auth(AuthType.None)`.
- **JWT-based post authorship** — create-post flow now uses authenticated user claims instead of request body `authorEmail`.
- **Google OAuth 2.0 API wrapper** — `GoogleAuthenticationService` wraps Google Auth Library; supports ID token verification, user lookup by `googleId`, JWT generation.
- **Dynamic filtering and sorting** on all three list endpoints:
	- Posts: date range, status, title search (ILike), sort by allowlisted fields
	- Users: firstName search (ILike), sort
	- Tags: name search (ILike), sort
	- `SortQueryDto` + module filter DTOs composed via `IntersectionType`
	- SQL injection protection via sortBy allowlist
- **Swagger Bearer Authentication** — `addBearerAuth()` in bootstrap, `@ApiBearerAuth('access-token')` on all protected controllers; Swagger UI now shows Authorize button
- **Full Swagger query param docs** — `@ApiPropertyOptional` decorators on all filter, sort, pagination fields with examples
- **DataResponseInterceptor** (global via `APP_INTERCEPTOR`) — wraps all responses in `{ apiVersion, data }` envelope
- **ClassSerializerInterceptor** (global via `APP_INTERCEPTOR`) — strips `@Exclude()` fields (`password`, `googleId`) from all responses automatically
- **Serialization via entity decorators** — `@Exclude()` on User entity sensitive fields; no manual field stripping needed
- **Unit test suite at 27/27 suites passing** — fixed 10 previously failing test specs (missing mock providers across auth and user providers)

## Week 10: Exception Filter + Middleware + E2E Tests + Mail Integration

Status: In Progress

- Global `HttpExceptionFilter` to standardise error response shape (Completed)
- Mail module with EJS templates and SMTP integration (Completed 2026-06-07)
  - MailerModule bootstrap with configurable SMTP transport
  - EJS template rendering with HTML + plain-text fallback
  - Asset pipeline config in nest-cli.json for template distribution
  - Welcome email triggered on user creation
- Simple `LoggerMiddleware` to log method + URL on every request (Optional, pending)
- E2E tests for bulk operations (success paths and transaction rollback)
- Auth-focused E2E tests (guard defaults, public route opt-out)

## Immediate Next Priorities

1. **E2E test coverage** for bulk endpoints (users, posts, tags): success cases, batch size limits, duplicate detection, transaction rollback on conflict.
2. **Auth route audit and tests** — add focused tests to verify default Bearer guard behavior and explicit `@Auth(AuthType.None)` bypass only on intended public endpoints.
3. **Uploads automated tests (deferred)** — add focused unit/integration coverage for uploads service/controller and CDN URL fallback behavior.
4. **Migration strategy** — replace `synchronize: true` with explicit TypeORM migrations when ready.
5. **Optional:** `LoggerMiddleware` for request logging (pipeline completeness).
6. **Optional:** Docker exploration for containerized local development and deployment simulation.

## Continuous Tracking Rules

- After each lesson, update the lesson log table below.
- If a problem occurs, log it in docs/learning-issues.md using: symptom, root cause, change made, verification result.
- Keep one commit (or one clear commit section) per lesson chunk when possible.

## Lesson-to-Implementation Log

| Date | Course Topic | Implementation Done | Evidence (Commit/PR/Doc) | Confidence (1-5) | Open Questions |
|---|---|---|---|---|---|
| 2026-05-18 | Bootstrap + validation + modules | v1 global prefix, global ValidationPipe, app module imports users/posts/auth | src/main.ts, src/app.module.ts, docs/learning-issues.md | 5 | Should a dedicated health module be added now or later with DB checks? |
| 2026-05-18 | Users module CRUD + DTOs | Users controller routes + create/update/patch DTOs + service with reusable not-found checks | src/modules/users/users.controller.ts, src/modules/users/provider/users.service.ts, docs/learning-issues.md | 4 | Replace in-memory service with repository/persistence next? |
| 2026-05-18 | Posts module DTO + patch flow | CreatePostDto structure with enums/metaOptions + posts create/get/patch routes + reusable not-found checks | src/modules/posts/dtos/create-post.dto.ts, src/modules/posts/posts.controller.ts, src/modules/posts/provider/posts.service.ts, docs/learning-issues.md | 4 | Enforce non-empty patch body and complete full CRUD now? |
| 2026-05-18 | API docs + Compodoc workflow | Swagger at /api + Compodoc scripts split (doc/doc:serve/doc:watch) + generated output isolation | src/main.ts, package.json, tsconfig.json, .gitignore, docs/learning-issues.md | 5 | Publish generated docs externally or keep local-only for learning? |
| 2026-05-19 | Users + posts repository transition | Replaced in-memory behavior with TypeORM repositories in users/posts services; create post now resolves author by email | src/modules/users/provider/users.service.ts, src/modules/posts/provider/posts.service.ts, docs/learning-issues.md | 4 | Should unauthorized checks move from generic Error to Nest UnauthorizedException globally? |
| 2026-05-19 | Post ownership relation and response shaping | Added post author relation to users and helper-based author response formatting (name + email) | src/modules/posts/post.entity.ts, src/modules/posts/helpers/format-post-with-author.helper.ts, src/modules/posts/provider/posts.service.ts | 4 | Add inverse `OneToMany` relation in user entity now or later when needed? |
| 2026-05-19 | Posts full CRUD completion | Added remaining posts operations: get by id, put, delete; added UpdatePostDto and aligned PatchPostDto; wired controller + service repository flow | src/modules/posts/posts.controller.ts, src/modules/posts/provider/posts.service.ts, src/modules/posts/dtos/update-post.dto.ts, src/modules/posts/dtos/patch-post.dto.ts | 4 | Should update/patch support author reassignment by email in a separate dedicated endpoint? |
| 2026-05-23 | Tags relationship integration + validation cleanup | Linked posts-tags via many-to-many (`post_tags`), added common tag relation validator, fixed tags DTO per-item validation, and aligned HTTP payloads with URL tag slugs | src/modules/posts/post.entity.ts, src/common/validators/tag-relation.validator.ts, src/modules/posts/dtos/create-post.dto.ts, src/modules/posts/provider/posts.service.ts | 5 | Should API accept tag IDs internally while keeping slugs as public identifiers? |
| 2026-05-23 | Reusable DB exception handling pattern | Added common helper to translate unique DB errors into ConflictException and reused it across create/update/patch post writes | src/common/exceptions/unique-constraint.helper.ts, src/modules/posts/provider/posts.service.ts | 5 | Generalize exception mapping into a global DB exception filter later? |
| 2026-05-29 | DB outage resilience + recovery | Kept API process bootable during DB outage, added background DB reconnection bootstrap, and mapped uninitialized/metadata DB errors to 503 for request-time handling | src/app.module.ts, src/database/database-connection.bootstrap.ts, src/common/exceptions/service-unavailable.helper.ts, docs/learning-issues.md | 5 | Add health endpoint that reports DB connectivity separately from API process health? |
| 2026-06-01 | Bulk operations + transactions | Created UserCreateManyProvider with atomic QueryRunner transactions; batch validation (size/duplicates); bulk-operation-error.helper for cascading error handling; pattern reusable for other modules | src/modules/users/provider/user-create-many.provider.ts, src/modules/users/dtos/create-many-users.dto.ts, src/common/exceptions/bulk-operation-error.helper.ts, docs/roadmap.md | 5 | Wire bulk endpoint in UsersController with Swagger decorators? |
| 2026-06-01 | Bulk operations expansion (posts & tags) | Extended bulk operations pattern to posts (with tag resolution) and tags modules; all high-priority modules now have atomic bulk create endpoints with full validation and transaction support | src/modules/posts/provider/post-create-many.provider.ts, src/modules/posts/dtos/create-many-posts.dto.ts, src/modules/posts/posts.controller.ts, src/modules/tags/providers/tag-create-many.provider.ts, src/modules/tags/dtos/create-many-tags.dto.ts, src/modules/tags/tags.controller.ts, docs/roadmap.md | 5 | E2E tests for bulk endpoints? Meta-options bulk operations? |
| 2026-06-01 | Shared pagination rollout | Applied shared pagination to all list GET endpoints (`users`, `posts`, `tags`) using PaginationQueryDto and PaginationProvider with unified paginated response metadata/links | src/common/paginations/dtos/pagination-query.dto.ts, src/common/paginations/provider/pagination.provider.ts, src/modules/users/users.controller.ts, src/modules/users/provider/users.service.ts, src/modules/tags/tags.controller.ts, src/modules/tags/providers/tags.service.ts | 5 | Should nested collections (for example posts inside GET /tags/:id) also be paginated? |
| 2026-06-01 | Pagination hardening | Strengthened pagination infrastructure with max limit enforcement, deterministic ordering defaults, query-preserving link generation, empty-result-safe pagination metadata, and dedicated provider behavior tests | src/common/paginations/dtos/pagination-query.dto.ts, src/common/paginations/provider/pagination.provider.ts, src/common/paginations/provider/pagination.provider.spec.ts, src/modules/posts/provider/posts.service.ts, src/modules/users/provider/users.service.ts, src/modules/tags/providers/tags.service.ts | 5 | Should high-volume endpoints move from offset pagination to cursor pagination in a later module? |
| 2026-06-03 | JWT global configuration consolidation | Moved JWT config from auth module local scope to global app config; added JWT environment validation (secret, audience, issuer, TTL); updated SignInProvider to use ConfigService; removed redundant local jwt.config file and directory | src/config/app.config.ts, src/config/environment.validation.ts, src/modules/auth/auth.module.ts, src/modules/auth/provider/sign-in.provider.ts | 5 | Are there other auth-specific configs that should be moved to global scope later? |
| 2026-06-04 | Global auth guard + JWT identity propagation | Registered `AuthenticationGuard` as APP_GUARD with default Bearer auth, introduced route-level auth metadata (`@Auth` + `AuthType`), added `@ActiveUser` decorator for claims access, and updated post creation flow to derive author from JWT instead of `authorEmail` payload field | src/app.module.ts, src/modules/auth/guards/authentication.guard.ts, src/modules/auth/decorators/auth.decorator.ts, src/modules/auth/decorators/active-user.decorator.ts, src/modules/posts/dtos/create-post.dto.ts, src/modules/posts/providers/create-post.provider.ts | 5 | Should refresh-token flow be added before expanding protected write operations? |
| 2026-06-05 | Google OAuth API wrapper + config fixes | Implemented GoogleAuthenticationService as API wrapper for Google Auth Library with ID token verification, user lookup by googleId, and JWT token generation; added google-authentication endpoint at /v1/auth/google-authentication; fixed TypeORM synchronize config parsing; added explicit error handling for null-user and missing token payloads | src/modules/auth/social/providers/google-authentication.service.ts, src/modules/auth/social/google-authentication.controller.ts, src/modules/users/providers/find-one-by-google-id.provider.ts, src/modules/users/providers/users.service.ts, src/app.module.ts, src/config/app.config.ts, docs/learning-issues.md | 4 | Should auto-provision (create user on first Google login) be added? Should refresh-token be generated alongside access token in Google flow? |
| 2026-06-06 | File upload module with Azure Blob + Front Door CDN | Replaced AWS upload flow with Azure Blob Storage module (single + multiple upload endpoints), persisted upload metadata in PostgreSQL, integrated Azure Front Door CDN URL generation with endpoint normalization/fallback guard, and validated via manual upload tests + Azure portal confirmation | src/modules/uploads/uploads.controller.ts, src/modules/uploads/providers/uploads.service.ts, src/modules/uploads/upload.entity.ts, src/config/app.config.ts, .env, .env.development.local, src/modules/uploads/http/*.http, docs/learning-issues.md | 5 | Add automated upload tests now or after finishing remaining Week 10 platform tasks? |
| 2026-06-07 | Mail module with EJS templates + SMTP transport | Configured MailerModule with SMTP credentials from ConfigService, set up EJS template adapter pointing to `src/modules/mail/templates/`, fixed mailer config nesting (moved `defaults`/`template` out of `transport`), added HTML template + plain-text fallback to welcome email, configured nest-cli asset copy for template distribution, added full JSDoc to MailService | src/modules/mail/mail.module.ts, src/modules/mail/providers/mail.service.ts, src/modules/mail/templates/welcome.ejs, nest-cli.json, docs/learning-issues.md | 5 | Add email verification flow with token-based links? Add email templates for password reset or account notifications? |
