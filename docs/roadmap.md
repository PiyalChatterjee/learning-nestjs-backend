# NestJS Masterclass Roadmap (Learning Course)

## Goal

Build a course-aligned backend in small learning increments, with proof of implementation and a clear next-step backlog.

## Current Snapshot (2026-06-01)

- Core app bootstrap is in place with versioned routing and validation.
- Users module has full controller-level CRUD-style routes with DTO validation and TypeORM repository-backed service methods.
- Posts module has CRUD endpoints (create, get all, get by id, put, patch, delete) with validated DTOs, enums, repository-backed service methods, formatted author details, and relation-aware tag resolution.
- Tags module now supports create/get/delete flows and is linked to posts through many-to-many mapping with a junction table.
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
- Post DTOs and enums implemented (create, update, patch + post type/status/meta options + authorEmail create flow).
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

Status: Complete (Learning Baseline)

- Swagger setup complete in bootstrap and endpoint decorators applied.
- Compodoc installed and script workflow standardized.
- Documentation generation scripts:
	- npm run doc
	- npm run doc:serve
	- npm run doc:watch
- Generated docs output moved to .compodoc and ignored from git tracking.

## Week 6: Auth + Advanced NestJS Concepts

Status: Complete (Learning Baseline)

- Auth module and service wiring are present.
- ForwardRef cross-module wiring between auth and users is implemented.
- Basic guard structure scaffolded; route protection ready for implementation.
- JWT/local strategy preparation in place; full production-grade auth guards pending.

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
  - `POST /users/bulk` — bulk user creation
  - `POST /posts/bulk` — bulk post creation with tags
  - `POST /tags/bulk` — bulk tag creation
- All tests pass (12 test suites, 12 passed); providers mocked in service tests
- Pattern is documented and ready for reuse in meta-options or future modules

## Week 9: Quality + Optional Docker Exploration

Status: In Progress

- E2E test coverage for bulk create success and partial failure handling (transaction rollback scenarios).
- Unit test expansion for new bulk operation patterns and transaction rollback scenarios.
- Auth guards and route protection (at least one JWT-protected endpoint).
- Optional: Docker exploration for containerized local development.
- Optional: Extend bulk operations pattern to meta-options module.
- Auth guards and route protection (JWT verification on protected endpoints).

## Immediate Next Priorities

1. **E2E test coverage** for bulk endpoints (users, posts, tags): success cases, batch size limits, duplicate detection, transaction rollback on conflict.
2. **Auth guards and route protection** — implement JWT verification on at least one protected users/posts endpoint using the `unauthorized` and `forbidden` helpers.
3. **Unit test expansion** for bulk providers: test transaction rollback scenarios, batch validation edge cases.
4. **Strengthen DB lifecycle further** by replacing `synchronize: true` with proper migration strategy and seeds.
5. **Integration tests** for `post_tags` write/read behavior, author-post ownership, and metadata nesting in bulk scenarios.
6. **Advanced query patterns**: author-centric queries, inverse mappings (users -> posts), pagination enhancements.
7. **Optional:** Extend bulk operations to meta-options module.
8. **Optional:** Docker exploration for containerized local development and deployment simulation.

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
